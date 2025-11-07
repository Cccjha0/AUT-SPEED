import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClaimsModule } from './claims/claims.module';
import { EvidenceModule } from './evidence/evidence.module';
import { ModerationModule } from './moderation/moderation.module';
import { PracticesModule } from './practices/practices.module';
import { RatingsModule } from './ratings/ratings.module';
import { SearchModule } from './search/search.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/speed',
        connectionFactory: (connection: Connection) => {
          connection.once('open', () => {
            // eslint-disable-next-line no-console
            console.log(`MongoDB connected: ${connection.name}`);
          });
          return connection;
        }
      })
    }),
    PracticesModule,
    ClaimsModule,
    SubmissionsModule,
    EvidenceModule,
    RatingsModule,
    ModerationModule,
    SearchModule,
    ...(process.env.NODE_ENV !== 'production' ? [AdminModule] : [])
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
