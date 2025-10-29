import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';

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
    })
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
