import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Log, LogSchema } from '../log/entities/log.entity';
import {
  DigitalSignFlow,
  DigitalSignFlowSchema,
} from './entities/digital-sign-flow.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DigitalSignFlow.name, schema: DigitalSignFlowSchema },
      { name: Log.name, schema: LogSchema },
    ]),
  ],
  controllers: [],
  providers: [],
})
export class DigitalSignFlowModule {}
