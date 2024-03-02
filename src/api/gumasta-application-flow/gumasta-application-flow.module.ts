import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GumastaApplicationFlow,
  GumastaApplicationFlowSchema,
} from './entities/gumasta-application-flow.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: GumastaApplicationFlow.name,
        schema: GumastaApplicationFlowSchema,
      },
    ]),
  ],
  controllers: [],
  providers: [],
})
export class GumastaApplicationFlowModule {}
