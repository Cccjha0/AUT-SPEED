import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { randomUUID } from 'crypto';
import { AppModule } from '../../src/app.module';
import { MailerService } from '../../src/notifications/providers/mailer.service';
import { PracticesService } from '../../src/practices/practices.service';
import { ClaimsService } from '../../src/claims/claims.service';
import { SubmissionsService } from '../../src/submissions/submissions.service';

export interface TestApp {
  app: INestApplication;
  httpServer: unknown;
  mongoServer: MongoMemoryServer;
  seed: () => Promise<{
    practiceKey: string;
    claimKey: string;
    submissionId: string;
    doi: string;
  }>;
  close: () => Promise<void>;
}

export async function createTestApp(): Promise<TestApp> {
  const mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule]
  })
    .overrideProvider(MailerService)
    .useValue({
      sendMail: async () => undefined
    })
    .compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true
    })
  );

  await app.init();

  const practicesService = app.get(PracticesService);
  const claimsService = app.get(ClaimsService);
  const submissionsService = app.get(SubmissionsService);

  async function seed() {
    const suffix = randomUUID().slice(0, 8);
    const practiceKey = `practice-${suffix}`;
    const claimKey = `claim-${suffix}`;
    const doi = `10.1000/${suffix}`;

    const practice = await practicesService.create({
      key: practiceKey,
      name: `Seed Practice ${suffix}`
    });

    const claim = await claimsService.create({
      key: claimKey,
      practiceKey,
      text: `Seed claim ${suffix}`
    });

    const submission = await submissionsService.create({
      title: `Seed Submission ${suffix}`,
      authors: ['Seed Author'],
      venue: 'Seed Venue',
      year: new Date().getFullYear(),
      volume: '1',
      number: '1',
      pages: '1-10',
      doi,
      submittedBy: 'Seed Seeder',
      submitterEmail: 'seed@example.com'
    });

    await submissionsService.accept(submission._id.toString());

    return {
      practiceKey,
      claimKey,
      submissionId: submission._id.toString(),
      doi
    };
  }

  return {
    app,
    httpServer: app.getHttpServer(),
    mongoServer,
    seed,
    close: async () => {
      await app.close();
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  };
}
