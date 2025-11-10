import { EvidenceMethodType, EvidenceParticipantType, EvidenceResult } from '../evidence/schemas/article-evidence.schema';
import { SubmissionStatus } from '../submissions/schemas/article-submission.schema';

export const PRACTICE_SEED = [
  { key: 'tdd', name: 'Test-Driven Development' },
  { key: 'pair', name: 'Pair Programming' },
  { key: 'review', name: 'Code Review' },
  { key: 'ci', name: 'Continuous Integration' },
  { key: 'mob', name: 'Mob Programming' }
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
    key: 'pair-boosts-learning',
    practiceKey: 'pair',
    text: 'Pairing increases onboarding speed for new engineers.'
  },
  {
    key: 'review-finds-bugs',
    practiceKey: 'review',
    text: 'Code review helps discover defects earlier.'
  },
  {
    key: 'ci-speeds-feedback',
    practiceKey: 'ci',
    text: 'Continuous Integration shortens feedback cycles for feature teams.'
  },
  {
    key: 'ci-reduces-merge-pain',
    practiceKey: 'ci',
    text: 'Frequent integration reduces merge conflicts.'
  },
  {
    key: 'mob-aligns-team',
    practiceKey: 'mob',
    text: 'Mob programming improves shared understanding of design decisions.'
  }
] as const;

export const SUBMISSION_SEED = [
  {
    title: 'Empirical Study of Code Reviews',
    authors: ['A. Smith', 'B. Lee'],
    venue: 'ICSE',
    year: 2024,
    doi: '10.1000/review-2024',
    submittedBy: 'Seed Curator',
    submitterEmail: 'seed+review@example.com',
    status: SubmissionStatus.Accepted
  },
  {
    title: 'Effect of TDD on Quality',
    authors: ['C. Kim', 'D. Park'],
    venue: 'ESEM',
    year: 2023,
    doi: '10.1000/tdd-2023',
    submittedBy: 'Seed Curator',
    submitterEmail: 'seed+tdd@example.com',
    status: SubmissionStatus.Accepted
  },
  {
    title: 'Continuous Integration in Large Orgs',
    authors: ['E. Gomez', 'F. Patel'],
    venue: 'XP',
    year: 2022,
    doi: '10.1000/ci-2022',
    submittedBy: 'Seed Curator',
    submitterEmail: 'seed+ci@example.com',
    status: SubmissionStatus.Accepted
  },
  {
    title: 'Mob Programming and Onboarding',
    authors: ['G. Chen', 'H. Rivera'],
    venue: 'Agile',
    year: 2021,
    doi: '10.1000/mob-2021',
    submittedBy: 'Seed Curator',
    submitterEmail: 'seed+mob@example.com',
    status: SubmissionStatus.Accepted
  }
] as const;

export const EVIDENCE_SEED = [
  {
    articleDoi: '10.1000/review-2024',
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
  },
  {
    articleDoi: '10.1000/ci-2022',
    practiceKey: 'ci',
    claimKey: 'ci-speeds-feedback',
    result: EvidenceResult.Agree,
    methodType: EvidenceMethodType.CaseStudy,
    participantType: EvidenceParticipantType.Practitioner,
    notes: 'CI pipelines reduced deploy cycle time by 40%',
    year: 2022
  },
  {
    articleDoi: '10.1000/ci-2022',
    practiceKey: 'ci',
    claimKey: 'ci-reduces-merge-pain',
    result: EvidenceResult.Agree,
    methodType: EvidenceMethodType.Survey,
    participantType: EvidenceParticipantType.Mixed,
    notes: 'Teams reported fewer merge conflicts after adopting CI',
    year: 2022
  },
  {
    articleDoi: '10.1000/mob-2021',
    practiceKey: 'mob',
    claimKey: 'mob-aligns-team',
    result: EvidenceResult.Mixed,
    methodType: EvidenceMethodType.CaseStudy,
    participantType: EvidenceParticipantType.Practitioner,
    notes: 'Alignment improved, but throughput varied by team',
    year: 2021
  },
  {
    articleDoi: '10.1000/mob-2021',
    practiceKey: 'pair',
    claimKey: 'pair-boosts-learning',
    result: EvidenceResult.Agree,
    methodType: EvidenceMethodType.CaseStudy,
    participantType: EvidenceParticipantType.Practitioner,
    notes: 'Teams pairing/mobbing onboarded new hires faster',
    year: 2021
  }
] as const;
