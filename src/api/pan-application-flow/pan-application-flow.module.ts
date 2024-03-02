import {
  PanApplicationFlow,
  PanAppFlowSchema,
} from './entities/pan-application-flow.entity';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PanApplicationFlow.name, schema: PanAppFlowSchema },
    ]),
  ],
  controllers: [],
  providers: [],
})
export class PanAppFlowModule {}
