import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ItrApplicationFlow,
  ItrApplicationFlowSchema,
} from './entities/itr-application-flow.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ItrApplicationFlow.name, schema: ItrApplicationFlowSchema },
    ]),
  ],
  controllers: [],
  providers: [],
})
export class ItrApplicationFlowModule {}
