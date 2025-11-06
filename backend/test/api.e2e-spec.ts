import mongoose from 'mongoose';
import request from 'supertest';
import { createTestApp, type TestApp } from './utils/test-app';

describe('REST API (e2e)', () => {
  let testApp: TestApp;
  let seedData: Awaited<ReturnType<TestApp['seed']>>;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
    seedData = await testApp.seed();
  });

  const server = () => testApp.app.getHttpServer();

  describe('Practices', () => {
    it('returns 400 when key or name missing', async () => {
      const res1 = await request(server())
        .post('/api/practices')
        .send({ name: 'Only Name' });
      expect(res1.status).toBe(400);

      const res2 = await request(server())
        .post('/api/practices')
        .send({ key: 'only-key' });
      expect(res2.status).toBe(400);
    });

    it('creates a practice successfully', async () => {
      const res = await request(server())
        .post('/api/practices')
        .send({ key: 'new-practice', name: 'New Practice' });
      expect(res.status).toBe(201);

      expect(res.body.data).toMatchObject({
        key: 'new-practice',
        name: 'New Practice'
      });
    });
  });

  describe('Claims', () => {
    it('returns 400 when practiceKey does not exist', async () => {
      await request(server())
        .post('/api/claims')
        .send({
          key: 'missing-practice-claim',
          practiceKey: 'unknown',
          text: 'Some text'
        })
        .expect(400);
    });

    it('creates a claim for an existing practice', async () => {
      const res = await request(server())
        .post('/api/claims')
        .send({
          key: 'new-claim',
          practiceKey: seedData.practiceKey,
          text: 'Claim text'
        })
        .expect(201);

      expect(res.body.data).toMatchObject({
        key: 'new-claim',
        practiceKey: seedData.practiceKey
      });
    });
  });

  describe('Submissions', () => {
    it('rejects submissions with invalid year', async () => {
      const invalidYear = new Date().getFullYear() + 5;
      await request(server())
        .post('/api/submissions')
        .send({
          title: 'Invalid Year',
          authors: ['Author'],
          venue: 'Conf',
          year: invalidYear,
          doi: '10.1000/invalid-year',
          submittedBy: 'user@example.com'
        })
        .expect(400);
    });

    it('queues submission and updates status via moderation actions', async () => {
      const createRes = await request(server())
        .post('/api/submissions')
        .send({
          title: 'Queued Submission',
          authors: ['Author'],
          venue: 'Conf',
          year: new Date().getFullYear(),
          doi: '10.1000/queued',
          submittedBy: 'user@example.com'
        })
        .expect(201);

      const submissionId = createRes.body.data._id;
      expect(createRes.body.data.status).toBe('queued');

      const acceptRes = await request(server())
        .patch(`/api/submissions/${submissionId}/accept`)
        .expect(200);

      expect(acceptRes.body.data.status).toBe('accepted');

      const rejectCreateRes = await request(server())
        .post('/api/submissions')
        .send({
          title: 'Reject Submission',
          authors: ['Author'],
          venue: 'Conf',
          year: new Date().getFullYear(),
          doi: '10.1000/reject',
          submittedBy: 'user@example.com'
        })
        .expect(201);

      const rejectId = rejectCreateRes.body.data._id;

      await request(server())
        .patch(`/api/submissions/${rejectId}/reject`)
        .send({})
        .expect(400);

      const rejectRes = await request(server())
        .patch(`/api/submissions/${rejectId}/reject`)
        .send({ rejectionReason: 'Insufficient details' })
        .expect(200);

      expect(rejectRes.body.data.status).toBe('rejected');
      expect(rejectRes.body.data.rejectionReason).toBe('Insufficient details');
    });
  });

  describe('Evidence', () => {
    it('rejects evidence when article DOI is not accepted', async () => {
      const submission = await request(server())
        .post('/api/submissions')
        .send({
          title: 'Unaccepted',
          authors: ['Author'],
          venue: 'Venue',
          year: new Date().getFullYear(),
          doi: '10.1000/unaccepted',
          submittedBy: 'user@example.com'
        })
        .expect(201);

      await request(server())
        .post('/api/evidence')
        .send({
          articleDoi: submission.body.data.doi,
          practiceKey: seedData.practiceKey,
          claimKey: seedData.claimKey,
          result: 'agree',
          methodType: 'experiment'
        })
        .expect(400);
    });

    it('rejects evidence when claim does not belong to practice', async () => {
      const otherPractice = await request(server())
        .post('/api/practices')
        .send({ key: 'other-practice', name: 'Other Practice' })
        .expect(201);

      const otherClaim = await request(server())
        .post('/api/claims')
        .send({
          key: 'other-claim',
          practiceKey: otherPractice.body.data.key,
          text: 'Other claim'
        })
        .expect(201);

      await request(server())
        .post('/api/evidence')
        .send({
          articleDoi: seedData.doi,
          practiceKey: seedData.practiceKey,
          claimKey: otherClaim.body.data.key,
          result: 'agree',
          methodType: 'experiment'
        })
        .expect(400);
    });

    it('creates evidence for accepted submission', async () => {
      const res = await request(server())
        .post('/api/evidence')
        .send({
          articleDoi: seedData.doi,
          practiceKey: seedData.practiceKey,
          claimKey: seedData.claimKey,
          result: 'agree',
          methodType: 'experiment',
          participantType: 'practitioner'
        })
        .expect(201);

      expect(res.body.data).toMatchObject({
        articleDoi: seedData.doi,
        practiceKey: seedData.practiceKey,
        claimKey: seedData.claimKey,
        result: 'agree'
      });
    });
  });

  describe('Search evidence filters and aggregations', () => {
    beforeEach(async () => {
      await request(server())
        .post('/api/evidence')
        .send({
          articleDoi: seedData.doi,
          practiceKey: seedData.practiceKey,
          claimKey: seedData.claimKey,
          result: 'agree',
          methodType: 'experiment',
          participantType: 'practitioner'
        })
        .expect(201);

      const submission2020 = await request(server())
        .post('/api/submissions')
        .send({
          title: 'Historical Study',
          authors: ['Author'],
          venue: 'Journal',
          year: 2020,
          doi: '10.1000/history',
          submittedBy: 'user@example.com'
        })
        .expect(201);

      const submissionId = submission2020.body.data._id;
      await request(server())
        .patch(`/api/submissions/${submissionId}/accept`)
        .expect(200);

      await request(server())
        .post('/api/evidence')
        .send({
          articleDoi: '10.1000/history',
          practiceKey: seedData.practiceKey,
          claimKey: seedData.claimKey,
          result: 'disagree',
          methodType: 'survey',
          participantType: 'student'
        })
        .expect(201);
    });

    it('filters by result and includes aggregations', async () => {
      const agreeRes = await request(server())
        .get(
          `/api/search/evidence?practiceKey=${seedData.practiceKey}&result=agree&limit=50&skip=0`
        )
        .expect(200);

      expect(agreeRes.body.data.items).toHaveLength(1);
      expect(agreeRes.body.data.items[0].result).toBe('agree');
      expect(agreeRes.body.data.aggregations.resultCounts.agree).toBe(1);
      expect(agreeRes.body.data.aggregations.resultCounts.disagree).toBe(0);

      const rangeRes = await request(server())
        .get(
          `/api/search/evidence?practiceKey=${seedData.practiceKey}&from=2019&to=2021&limit=50&skip=0`
        )
        .expect(200);

      expect(rangeRes.body.data.items.length).toBeGreaterThanOrEqual(1);
      const counts = rangeRes.body.data.aggregations.resultCounts;
      expect(counts.agree + counts.disagree + counts.mixed).toBe(
        rangeRes.body.data.items.length
      );
    });
  });

  describe('Pagination limit/skip handling', () => {
    it('paginates practices without repeating items across pages', async () => {
      const practices = [
        { key: 'paginate-practice-a', name: 'Paginate Practice A' },
        { key: 'paginate-practice-b', name: 'Paginate Practice B' }
      ];

      for (const practice of practices) {
        await request(server())
          .post('/api/practices')
          .send(practice)
          .expect(201);
      }

      const firstPage = await request(server())
        .get('/api/practices?limit=1&skip=0')
        .expect(200);

      const secondPage = await request(server())
        .get('/api/practices?limit=1&skip=1')
        .expect(200);

      expect(firstPage.body.error).toBeNull();
      expect(secondPage.body.error).toBeNull();
      expect(firstPage.body.data.items).toHaveLength(1);
      expect(secondPage.body.data.items).toHaveLength(1);
      const firstId = firstPage.body.data.items[0]._id;
      const secondId = secondPage.body.data.items[0]._id;
      expect(firstId).not.toBe(secondId);
    });

    it('paginates claims scoped by practice', async () => {
      const practice = await request(server())
        .post('/api/practices')
        .send({ key: 'paginate-practice-claims', name: 'Claims Practice' })
        .expect(201);

      const claimPayloads = [
        {
          key: 'paginate-claim-a',
          practiceKey: practice.body.data.key,
          text: 'Claim Alpha'
        },
        {
          key: 'paginate-claim-b',
          practiceKey: practice.body.data.key,
          text: 'Claim Beta'
        }
      ];

      for (const claim of claimPayloads) {
        await request(server()).post('/api/claims').send(claim).expect(201);
      }

      const firstPage = await request(server())
        .get(
          `/api/claims?practiceKey=${practice.body.data.key}&limit=1&skip=0`
        )
        .expect(200);
      const secondPage = await request(server())
        .get(
          `/api/claims?practiceKey=${practice.body.data.key}&limit=1&skip=1`
        )
        .expect(200);

      expect(firstPage.body.error).toBeNull();
      expect(secondPage.body.error).toBeNull();
      expect(firstPage.body.data.items).toHaveLength(1);
      expect(secondPage.body.data.items).toHaveLength(1);
      const firstKey = firstPage.body.data.items[0].key;
      const secondKey = secondPage.body.data.items[0].key;
      expect(firstKey).not.toBe(secondKey);
    });

    it('paginates moderation queue results', async () => {
      const submissions = [
        {
          title: 'Queued Pagination A',
          authors: ['Author'],
          venue: 'Venue',
          year: new Date().getFullYear(),
          doi: '10.1000/paginate-a',
          submittedBy: 'queue@example.com'
        },
        {
          title: 'Queued Pagination B',
          authors: ['Author'],
          venue: 'Venue',
          year: new Date().getFullYear(),
          doi: '10.1000/paginate-b',
          submittedBy: 'queue@example.com'
        }
      ];

      for (const submission of submissions) {
        await request(server()).post('/api/submissions').send(submission).expect(201);
      }

      const firstPage = await request(server())
        .get('/api/moderation/queue?limit=1&skip=0')
        .expect(200);
      const secondPage = await request(server())
        .get('/api/moderation/queue?limit=1&skip=1')
        .expect(200);

      expect(firstPage.body.error).toBeNull();
      expect(secondPage.body.error).toBeNull();
      expect(firstPage.body.data.items).toHaveLength(1);
      expect(secondPage.body.data.items).toHaveLength(1);
      const firstId = firstPage.body.data.items[0]._id;
      const secondId = secondPage.body.data.items[0]._id;
      expect(firstId).not.toBe(secondId);
    });

    it('paginates search results for practices and claims', async () => {
      const practiceA = await request(server())
        .post('/api/practices')
        .send({ key: 'search-practice-a', name: 'Search Practice A' })
        .expect(201);
      const practiceB = await request(server())
        .post('/api/practices')
        .send({ key: 'search-practice-b', name: 'Search Practice B' })
        .expect(201);

      const claimPayloads = [
        {
          key: 'search-claim-a',
          practiceKey: practiceA.body.data.key,
          text: 'Search Claim Alpha'
        },
        {
          key: 'search-claim-b',
          practiceKey: practiceA.body.data.key,
          text: 'Search Claim Beta'
        }
      ];
      for (const claim of claimPayloads) {
        await request(server()).post('/api/claims').send(claim).expect(201);
      }

      const practicesPage1 = await request(server())
        .get('/api/search/practices?limit=1&skip=0')
        .expect(200);
      const practicesPage2 = await request(server())
        .get('/api/search/practices?limit=1&skip=1')
        .expect(200);

      expect(practicesPage1.body.error).toBeNull();
      expect(practicesPage2.body.error).toBeNull();
      expect(practicesPage1.body.data.items).toHaveLength(1);
      expect(practicesPage2.body.data.items).toHaveLength(1);
      const practiceFirst = practicesPage1.body.data.items[0].key;
      const practiceSecond = practicesPage2.body.data.items[0].key;
      expect(practiceFirst).not.toBe(practiceSecond);

      const claimsPage1 = await request(server())
        .get(
          `/api/search/claims?practiceKey=${practiceA.body.data.key}&limit=1&skip=0`
        )
        .expect(200);
      const claimsPage2 = await request(server())
        .get(
          `/api/search/claims?practiceKey=${practiceA.body.data.key}&limit=1&skip=1`
        )
        .expect(200);

      expect(claimsPage1.body.error).toBeNull();
      expect(claimsPage2.body.error).toBeNull();
      expect(claimsPage1.body.data.items).toHaveLength(1);
      expect(claimsPage2.body.data.items).toHaveLength(1);
      const claimFirst = claimsPage1.body.data.items[0].key;
      const claimSecond = claimsPage2.body.data.items[0].key;
      expect(claimFirst).not.toBe(claimSecond);
    });

    it('paginates search evidence results without duplicates across pages', async () => {
      const submission = await request(server())
        .post('/api/submissions')
        .send({
          title: 'Accepted Pagination A',
          authors: ['Author'],
          venue: 'Venue',
          year: new Date().getFullYear(),
          doi: '10.1000/paginate-evidence-a',
          submittedBy: 'queue@example.com'
        })
        .expect(201);
      await request(server())
        .patch(`/api/submissions/${submission.body.data._id}/accept`)
        .expect(200);

      await request(server())
        .post('/api/evidence')
        .send({
          articleDoi: seedData.doi,
          practiceKey: seedData.practiceKey,
          claimKey: seedData.claimKey,
          result: 'agree',
          methodType: 'experiment'
        })
        .expect(201);

      await request(server())
        .post('/api/evidence')
        .send({
          articleDoi: submission.body.data.doi,
          practiceKey: seedData.practiceKey,
          claimKey: seedData.claimKey,
          result: 'disagree',
          methodType: 'survey'
        })
        .expect(201);

      const page1 = await request(server())
        .get(
          `/api/search/evidence?practiceKey=${seedData.practiceKey}&limit=1&skip=0`
        )
        .expect(200);
      const page2 = await request(server())
        .get(
          `/api/search/evidence?practiceKey=${seedData.practiceKey}&limit=1&skip=1`
        )
        .expect(200);

      expect(page1.body.error).toBeNull();
      expect(page2.body.error).toBeNull();
      expect(page1.body.data.items).toHaveLength(1);
      expect(page2.body.data.items).toHaveLength(1);
      const page1Id = page1.body.data.items[0]._id;
      const page2Id = page2.body.data.items[0]._id;
      expect(page1Id).not.toBe(page2Id);
    });
  });

  describe('Ratings', () => {
    it('rejects invalid star values', async () => {
      await request(server())
        .post('/api/ratings')
        .send({
          doi: seedData.doi,
          stars: 6
        })
        .expect(400);
    });

    it('allows duplicate user+doi ratings to overwrite previous value', async () => {
      const first = await request(server())
        .post('/api/ratings')
        .send({
          doi: seedData.doi,
          stars: 3,
          user: 'user@example.com'
        })
        .expect(201);

      expect(first.body.data.stars).toBe(3);

      const second = await request(server())
        .post('/api/ratings')
        .send({
          doi: seedData.doi,
          stars: 5,
          user: 'user@example.com'
        })
        .expect(201);

      expect(second.body.data.stars).toBe(5);

      const avg = await request(server())
        .get(`/api/ratings/avg?doi=${encodeURIComponent(seedData.doi)}`)
        .expect(200);

      expect(avg.body.data.average).toBe(5);
      expect(avg.body.data.count).toBe(1);
    });
  });
});
