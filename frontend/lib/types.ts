export interface SearchResponse<T> {
  data?: {
    items: T[];
    total: number;
    limit: number;
    skip: number;
    aggregations?: Record<string, unknown>;
  };
  error?: {
    message?: string;
  } | null;
}

export interface PracticeSummary {
  key: string;
  name: string;
}

export interface ClaimSummary {
  key: string;
  practiceKey: string;
  text: string;
}

export type EvidenceResult = 'agree' | 'disagree' | 'mixed';
export type EvidenceMethodType =
  | 'experiment'
  | 'case-study'
  | 'survey'
  | 'meta-analysis'
  | 'other';
export type EvidenceParticipantType = 'student' | 'practitioner' | 'mixed' | 'unknown';

export interface EvidenceItem {
  _id: string;
  articleDoi: string;
  practiceKey: string;
  claimKey: string;
  result: EvidenceResult;
  methodType: EvidenceMethodType;
  participantType?: EvidenceParticipantType;
  analyst?: string;
  notes?: string;
  createdAt?: string;
  article?: {
    title?: string;
    venue?: string;
    year?: number;
    authors?: string[];
    doi: string;
  };
}

export interface RatingsAverageResponse {
  doi: string;
  average: number | null;
  count: number;
}

export type AnalysisStatus = 'none' | 'todo' | 'in_progress' | 'done';

export interface AnalysisQueueItem {
  _id: string;
  title: string;
  authors: string[];
  venue?: string;
  year?: number;
  doi?: string;
  analysisStatus: AnalysisStatus;
  assignedAnalyst?: string;
  submitterEmail?: string;
  submittedBy?: string;
  createdAt?: string;
}
