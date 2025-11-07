import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, UpdateResult } from 'mongoose';
import type { ClaimDocument } from '../claims/schemas/claim.schema';
import { Claim } from '../claims/schemas/claim.schema';
import type { PracticeDocument } from '../practices/schemas/practice.schema';
import { Practice } from '../practices/schemas/practice.schema';
import type { ArticleSubmissionDocument } from '../submissions/schemas/article-submission.schema';
import {
  ArticleSubmission,
  SubmissionStatus
} from '../submissions/schemas/article-submission.schema';
import type { ArticleEvidenceDocument } from '../evidence/schemas/article-evidence.schema';
import { ArticleEvidence } from '../evidence/schemas/article-evidence.schema';
import {
  CLAIM_SEED,
  EVIDENCE_SEED,
  PRACTICE_SEED,
  SUBMISSION_SEED
} from './constants';

interface SeedResult {
  inserted: number;
  skipped: number;
  details: Record<string, unknown>[];
}

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Practice.name)
    private readonly practiceModel: Model<PracticeDocument>,
    @InjectModel(Claim.name)
    private readonly claimModel: Model<ClaimDocument>,
    @InjectModel(ArticleSubmission.name)
    private readonly submissionModel: Model<ArticleSubmissionDocument>,
    @InjectModel(ArticleEvidence.name)
    private readonly evidenceModel: Model<ArticleEvidenceDocument>
  ) {}

  ensureNotProduction() {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException('Admin endpoints disabled in production');
    }
  }

  async seedPractices(): Promise<SeedResult> {
    this.ensureNotProduction();
    const details: SeedResult['details'] = [];
    let inserted = 0;
    let skipped = 0;

    for (const practice of PRACTICE_SEED) {
      const result = await this.practiceModel.updateOne(
        { key: practice.key },
        { $setOnInsert: practice },
        { upsert: true }
      );
      const wasInserted = this.wasInserted(result);
      if (wasInserted) {
        inserted += 1;
      } else {
        skipped += 1;
      }
      details.push({
        key: practice.key,
        action: wasInserted ? 'inserted' : 'skipped'
      });
    }

    return { inserted, skipped, details };
  }

  async seedClaims(): Promise<SeedResult> {
    this.ensureNotProduction();
    const details: SeedResult['details'] = [];
    let inserted = 0;
    let skipped = 0;

    for (const claim of CLAIM_SEED) {
      const practiceExists = await this.practiceModel.exists({ key: claim.practiceKey });
      if (!practiceExists) {
        throw new BadRequestException(`Practice ${claim.practiceKey} not found for claim ${claim.key}`);
      }

      const result = await this.claimModel.updateOne(
        { key: claim.key },
        { $setOnInsert: claim },
        { upsert: true }
      );
      const wasInserted = this.wasInserted(result);
      if (wasInserted) {
        inserted += 1;
      } else {
        skipped += 1;
      }
      details.push({
        key: claim.key,
        action: wasInserted ? 'inserted' : 'skipped'
      });
    }

    return { inserted, skipped, details };
  }

  async seedSubmissions(): Promise<SeedResult> {
    this.ensureNotProduction();
    const details: SeedResult['details'] = [];
    let inserted = 0;
    let skipped = 0;

    for (const submission of SUBMISSION_SEED) {
      const payload = {
        ...submission,
        status: SubmissionStatus.Accepted,
        rejectionReason: undefined
      };

      const existing = await this.submissionModel.findOne({ doi: submission.doi }).lean();
      const result = await this.submissionModel.updateOne(
        { doi: submission.doi },
        {
          $set: payload,
          $unset: { rejectionReason: '' }
        },
        { upsert: true }
      );

      const wasInserted = this.wasInserted(result) || !existing;
      if (wasInserted) {
        inserted += 1;
      } else {
        skipped += 1;
      }
      details.push({
        doi: submission.doi,
        action: wasInserted ? 'inserted' : 'skipped'
      });
    }

    return { inserted, skipped, details };
  }

  async seedEvidence(): Promise<SeedResult> {
    this.ensureNotProduction();

    const details: SeedResult['details'] = [];
    let inserted = 0;
    let skipped = 0;

    for (const entry of EVIDENCE_SEED) {
      await this.guardEvidenceDependencies(entry.practiceKey, entry.claimKey, entry.articleDoi);

      const payload = {
        articleDoi: entry.articleDoi,
        practiceKey: entry.practiceKey,
        claimKey: entry.claimKey,
        result: entry.result,
        methodType: entry.methodType,
        participantType: entry.participantType,
        notes: entry.notes
      };

      const result = await this.evidenceModel.updateOne(
        { articleDoi: entry.articleDoi, claimKey: entry.claimKey },
        { $setOnInsert: payload },
        { upsert: true }
      );

      const wasInserted = this.wasInserted(result);
      if (wasInserted) {
        inserted += 1;
      } else {
        skipped += 1;
      }
      details.push({
        articleDoi: entry.articleDoi,
        claimKey: entry.claimKey,
        action: wasInserted ? 'inserted' : 'skipped'
      });
    }

    return { inserted, skipped, details };
  }

  async seedAll() {
    this.ensureNotProduction();
    const practiceResult = await this.seedPractices();
    const claimResult = await this.seedClaims();
    const submissionResult = await this.seedSubmissions();
    const evidenceResult = await this.seedEvidence();

    return {
      inserted:
        practiceResult.inserted +
        claimResult.inserted +
        submissionResult.inserted +
        evidenceResult.inserted,
      skipped:
        practiceResult.skipped +
        claimResult.skipped +
        submissionResult.skipped +
        evidenceResult.skipped,
      details: [
        { type: 'practices', ...practiceResult },
        { type: 'claims', ...claimResult },
        { type: 'submissions', ...submissionResult },
        { type: 'evidence', ...evidenceResult }
      ]
    };
  }

  private async guardEvidenceDependencies(practiceKey: string, claimKey: string, articleDoi: string) {
    const submission = await this.submissionModel
      .findOne({ doi: articleDoi, status: SubmissionStatus.Accepted })
      .lean();
    if (!submission) {
      throw new BadRequestException(`Submission ${articleDoi} is not accepted or does not exist`);
    }

    const practice = await this.practiceModel.findOne({ key: practiceKey }).lean();
    if (!practice) {
      throw new BadRequestException(`Practice ${practiceKey} not found`);
    }

    const claim = await this.claimModel.findOne({ key: claimKey }).lean();
    if (!claim) {
      throw new BadRequestException(`Claim ${claimKey} not found`);
    }

    if (claim.practiceKey !== practiceKey) {
      throw new BadRequestException(
        `Claim ${claimKey} does not belong to practice ${practiceKey}`
      );
    }
  }

  private wasInserted(result: UpdateResult | { upsertedCount?: number }) {
    return Boolean((result as UpdateResult).upsertedCount);
  }
}
