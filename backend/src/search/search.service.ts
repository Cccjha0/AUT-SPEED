import {
  BadRequestException,
  Injectable
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { FilterQuery, Model, PipelineStage } from 'mongoose';
import type { ArticleEvidenceDocument } from '../evidence/schemas/article-evidence.schema';
import {
  ArticleEvidence,
  EvidenceMethodType,
  EvidenceParticipantType,
  EvidenceResult
} from '../evidence/schemas/article-evidence.schema';
import type { PracticeDocument } from '../practices/schemas/practice.schema';
import { Practice } from '../practices/schemas/practice.schema';
import type { ClaimDocument } from '../claims/schemas/claim.schema';
import { Claim } from '../claims/schemas/claim.schema';
import type { ArticleSubmissionDocument } from '../submissions/schemas/article-submission.schema';
import {
  ArticleSubmission,
  SubmissionStatus
} from '../submissions/schemas/article-submission.schema';
import type { UserRatingDocument } from '../ratings/schemas/user-rating.schema';
import { UserRating } from '../ratings/schemas/user-rating.schema';
import type { SearchPracticesDto } from './dto/search-practices.dto';
import type { SearchClaimsDto } from './dto/search-claims.dto';
import type { SearchEvidenceDto } from './dto/search-evidence.dto';
import { EvidenceSortField } from './dto/search-evidence.dto';
import type { SearchRatingsDto } from './dto/search-ratings.dto';
import {
  SavedQuery,
  SavedQueryDocument
} from './schemas/saved-query.schema';

type ResultCounts = Record<EvidenceResult, number>;
export interface EvidenceFilterSnapshot {
  practiceKey?: string;
  claimKey?: string;
  result?: EvidenceResult;
  methodType?: EvidenceMethodType;
  participantType?: EvidenceParticipantType;
  from?: number;
  to?: number;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Practice.name)
    private readonly practiceModel: Model<PracticeDocument>,
    @InjectModel(Claim.name)
    private readonly claimModel: Model<ClaimDocument>,
    @InjectModel(ArticleEvidence.name)
    private readonly evidenceModel: Model<ArticleEvidenceDocument>,
    @InjectModel(ArticleSubmission.name)
    private readonly submissionModel: Model<ArticleSubmissionDocument>,
    @InjectModel(UserRating.name)
    private readonly ratingModel: Model<UserRatingDocument>,
    @InjectModel(SavedQuery.name)
    private readonly savedQueryModel: Model<SavedQueryDocument>
  ) {}

  async searchPractices(query: SearchPracticesDto) {
    const { query: text, limit = 10, skip = 0 } = query;
    const safeLimit = Math.min(Math.max(limit, 0), 100);
    const safeSkip = Math.max(skip, 0);

    const filter: FilterQuery<PracticeDocument> = {};
    if (text) {
      const regex = this.buildContainsRegex(text);
      filter.$or = [{ key: regex }, { name: regex }];
    }

    const [items, total] = await Promise.all([
      this.practiceModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(safeSkip)
        .limit(safeLimit)
        .lean(),
      this.practiceModel.countDocuments(filter)
    ]);

    return {
      items,
      total,
      limit: safeLimit,
      skip: safeSkip
    };
  }

  async searchClaims(query: SearchClaimsDto) {
    const { query: text, practiceKey, limit = 10, skip = 0 } = query;
    const safeLimit = Math.min(Math.max(limit, 0), 100);
    const safeSkip = Math.max(skip, 0);

    const filter: FilterQuery<ClaimDocument> = {};
    if (practiceKey) {
      filter.practiceKey = practiceKey;
    }
    if (text) {
      const regex = this.buildContainsRegex(text);
      filter.$or = [{ key: regex }, { text: regex }];
    }

    const [items, total] = await Promise.all([
      this.claimModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(safeSkip)
        .limit(safeLimit)
        .lean(),
      this.claimModel.countDocuments(filter)
    ]);

    return {
      items,
      total,
      limit: safeLimit,
      skip: safeSkip
    };
  }

  async searchEvidence(query: SearchEvidenceDto) {
    const {
      practiceKey,
      claimKey,
      result,
      methodType,
      participantType,
      from,
      to,
      sortBy = 'createdAt',
      sortDirection = 'desc',
      limit = 10,
      skip = 0
    } = query;

    if (from && to && from > to) {
      throw new BadRequestException('`from` year cannot be greater than `to` year');
    }

    const safeLimit = Math.min(Math.max(limit, 0), 100);
    const safeSkip = Math.max(skip, 0);

    const filter: FilterQuery<ArticleEvidenceDocument> = {};
    if (practiceKey) {
      filter.practiceKey = practiceKey;
    }
    if (claimKey) {
      filter.claimKey = claimKey;
    }
    if (result) {
      filter.result = result;
    }
    if (methodType) {
      filter.methodType = methodType;
    }
    if (participantType) {
      filter.participantType = participantType;
    }

    const doiFilter = await this.buildArticleDoiFilter(from, to);
    if (doiFilter === null) {
      return {
        items: [],
        total: 0,
        limit: safeLimit,
        skip: safeSkip,
        aggregations: {
          resultCounts: this.emptyResultCounts()
        }
      };
    }

    if (doiFilter) {
      filter.articleDoi = { $in: doiFilter };
    }

    const pipeline: PipelineStage[] = [
      { $match: filter },
      {
        $lookup: {
          from: this.submissionModel.collection.name,
          localField: 'articleDoi',
          foreignField: 'doi',
          as: 'submission'
        }
      },
      {
        $addFields: {
          submission: { $first: '$submission' }
        }
      },
      {
        $lookup: {
          from: this.ratingModel.collection.name,
          let: { doi: '$articleDoi' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$articleDoi', '$$doi'] }
              }
            },
            {
              $group: {
                _id: '$articleDoi',
                average: { $avg: '$stars' },
                count: { $sum: 1 }
              }
            }
          ],
          as: 'ratingStats'
        }
      },
      {
        $addFields: {
          avgRating: {
            $let: {
              vars: {
                stat: { $arrayElemAt: ['$ratingStats', 0] }
              },
              in: {
                average: '$$stat.average',
                count: '$$stat.count'
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          articleDoi: 1,
          practiceKey: 1,
          claimKey: 1,
          result: 1,
          methodType: 1,
          participantType: 1,
          analyst: 1,
          notes: 1,
          createdAt: 1,
          avgRating: {
            average: { $ifNull: ['$avgRating.average', null] },
            count: { $ifNull: ['$avgRating.count', 0] }
          },
          article: {
            title: '$submission.title',
            venue: '$submission.venue',
            year: '$submission.year',
            authors: '$submission.authors',
            doi: '$articleDoi'
          }
        }
      },
      { $sort: this.buildEvidenceSortStage(sortBy, sortDirection) },
      { $skip: safeSkip },
      { $limit: safeLimit }
    ];

    const [items, total, resultAggregation] = await Promise.all([
      this.evidenceModel.aggregate(pipeline).exec(),
      this.evidenceModel.countDocuments(filter),
      this.aggregateEvidenceByResult(filter)
    ]);

    return {
      items,
      total,
      limit: safeLimit,
      skip: safeSkip,
      aggregations: {
        resultCounts: resultAggregation
      }
    };
  }

  async averageRating(query: SearchRatingsDto) {
    const { doi } = query;

    const [stats] = await this.ratingModel
      .aggregate([
        { $match: { articleDoi: doi } },
        {
          $group: {
            _id: '$articleDoi',
            average: { $avg: '$stars' },
            count: { $sum: 1 }
          }
        }
      ])
      .exec();

    if (!stats) {
      return {
        doi,
        average: null,
        count: 0
      };
    }

    return {
      doi,
      average: stats.average,
      count: stats.count
    };
  }

  async saveQuery(params: {
    owner: string;
    name: string;
    query: EvidenceFilterSnapshot;
  }) {
    const doc = await this.savedQueryModel.create({
      owner: params.owner,
      name: params.name,
      query: params.query
    });
    return doc.toObject();
  }

  async listSavedQueries(owner: string, limit = 50) {
    const safeLimit = Math.min(Math.max(limit, 0), 100);
    const items = await this.savedQueryModel
      .find({ owner: owner.toLowerCase() })
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .lean();
    return {
      items,
      total: items.length,
      limit: safeLimit
    };
  }

  sanitizeFiltersForSave(filters: EvidenceFilterSnapshot) {
    const sanitized: EvidenceFilterSnapshot = {};
    if (filters.practiceKey) {
      sanitized.practiceKey = filters.practiceKey;
    }
    if (filters.claimKey) {
      sanitized.claimKey = filters.claimKey;
    }
    if (filters.result) {
      sanitized.result = filters.result;
    }
    if (filters.methodType) {
      sanitized.methodType = filters.methodType;
    }
    if (filters.participantType) {
      sanitized.participantType = filters.participantType;
    }
    if (filters.from) {
      sanitized.from = filters.from;
    }
    if (filters.to) {
      sanitized.to = filters.to;
    }
    return sanitized;
  }

  private buildContainsRegex(text: string) {
    return new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  private emptyResultCounts(): ResultCounts {
    return {
      [EvidenceResult.Agree]: 0,
      [EvidenceResult.Disagree]: 0,
      [EvidenceResult.Mixed]: 0
    };
  }

  private async aggregateEvidenceByResult(
    filter: FilterQuery<ArticleEvidenceDocument>
  ): Promise<ResultCounts> {
    const counts = this.emptyResultCounts();
    const aggregation = await this.evidenceModel
      .aggregate<{ _id: EvidenceResult; count: number }>([
        { $match: filter },
        {
          $group: {
            _id: '$result',
            count: { $sum: 1 }
          }
        }
      ])
      .exec();

    aggregation.forEach(entry => {
      counts[entry._id] = entry.count;
    });

    return counts;
  }

  private buildEvidenceSortStage(
    sortBy: string,
    direction: string
  ): Record<string, 1 | -1> {
    const dir: 1 | -1 = direction === 'asc' ? 1 : -1;
    const fallback: 1 | -1 = -1;
    switch (sortBy) {
      case EvidenceSortField.Year:
        return { 'article.year': dir, createdAt: fallback };
      case EvidenceSortField.Author:
        return { 'article.authors.0': dir, createdAt: fallback };
      case EvidenceSortField.AvgRating:
        return { 'avgRating.average': dir, createdAt: fallback };
      case EvidenceSortField.Practice:
        return { practiceKey: dir, createdAt: fallback };
      case EvidenceSortField.Claim:
        return { claimKey: dir, createdAt: fallback };
      case EvidenceSortField.Result:
        return { result: dir, createdAt: fallback };
      case EvidenceSortField.Method:
        return { methodType: dir, createdAt: fallback };
      case EvidenceSortField.Participant:
        return { participantType: dir, createdAt: fallback };
      default:
        return { createdAt: dir };
    }
  }

  private async buildArticleDoiFilter(
    yearFrom?: number,
    yearTo?: number
  ): Promise<string[] | null | undefined> {
    if (!yearFrom && !yearTo) {
      return undefined;
    }

    const submissionFilter: FilterQuery<ArticleSubmissionDocument> = {
      status: SubmissionStatus.Accepted,
      doi: { $ne: null }
    };

    if (yearFrom || yearTo) {
      const yearFilter: FilterQuery<ArticleSubmissionDocument>['year'] = {};

      if (yearFrom) {
        yearFilter.$gte = yearFrom;
      }

      if (yearTo) {
        yearFilter.$lte = yearTo;
      }

      submissionFilter.year = yearFilter;
    }

    const dois = await this.submissionModel.distinct('doi', submissionFilter);

    if (!dois.length) {
      return null;
    }

    return dois as string[];
  }
}


