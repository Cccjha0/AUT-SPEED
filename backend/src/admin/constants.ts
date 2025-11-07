import { EvidenceMethodType, EvidenceParticipantType, EvidenceResult } from '../evidence/schemas/article-evidence.schema';
import { SubmissionStatus } from '../submissions/schemas/article-submission.schema';

export const PRACTICE_SEED = [
  { key: 'tdd', name: 'Test-Driven Development' },
  { key: 'pair', name: 'Pair Programming' },
  { key: 'review', name: 'Code Review' }
] as const;

export const CLAIM_SEED = [
  {
    key: 'tdd-improves-quality',
    practiceKey: 'tdd',
    text: 'TDD improves software quality in enterprise projects.'
  },
  {
    key: 'tdd-increases-effort',
    practiceKey: 'tdd',
    text: 'TDD increases initial development effort.'
  },
  {
    key: 'pair-reduces-defects',
    practiceKey: 'pair',
    text: 'Pair programming reduces defect rate.'
  },
  {
    key: 'review-finds-bugs',
    practiceKey: 'review',
    text: 'Code review helps discover defects earlier.'
  }
] as const;

export const SUBMISSION_SEED = [
  {
    title: 'Empirical Study of Code Reviews',
    authors: ['A. Smith', 'B. Lee'],
    venue: 'ICSE',
    year: 2024,
    doi: '10.1000/tdd-2024',
    submittedBy: 'seed',
    status: SubmissionStatus.Accepted
  },
  {
    title: 'Effect of TDD on Quality',
    authors: ['C. Kim', 'D. Park'],
    venue: 'ESEM',
    year: 2023,
    doi: '10.1000/tdd-2023',
    submittedBy: 'seed',
    status: SubmissionStatus.Accepted
  }
] as const;

export const EVIDENCE_SEED = [
  {
    articleDoi: '10.1000/tdd-2024',
    practiceKey: 'review',
    claimKey: 'review-finds-bugs',
    result: EvidenceResult.Agree,
    methodType: EvidenceMethodType.Experiment,
    participantType: EvidenceParticipantType.Practitioner,
    notes: 'Higher defect detection rate in industry teams',
    year: 2024
  },
  {
    articleDoi: '10.1000/tdd-2023',
    practiceKey: 'tdd',
    claimKey: 'tdd-improves-quality',
    result: EvidenceResult.Agree,
    methodType: EvidenceMethodType.CaseStudy,
    participantType: EvidenceParticipantType.Mixed,
    notes: 'Quality improvements reported in case study',
    year: 2023
  },
  {
    articleDoi: '10.1000/tdd-2023',
    practiceKey: 'tdd',
    claimKey: 'tdd-increases-effort',
    result: EvidenceResult.Mixed,
    methodType: EvidenceMethodType.Survey,
    participantType: EvidenceParticipantType.Practitioner,
    notes: 'Initial effort higher; long-term neutral',
    year: 2023
  }
] as const;
