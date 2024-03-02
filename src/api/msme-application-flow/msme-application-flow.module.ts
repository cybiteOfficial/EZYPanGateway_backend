import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MsmeApplicationFlow,
  MsmeApplicationFlowSchema,
} from './entities/msme-application-flow.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MsmeApplicationFlow.name, schema: MsmeApplicationFlowSchema },
    ]),
  ],
  controllers: [],
  providers: [],
})
export class MsmeApplicationFlowModule {}
