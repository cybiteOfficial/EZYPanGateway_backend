import {
  DigitalPanApplicationFlow,
  DigitalPanFlowSchema,
} from './entities/digital-pan-flow.entity';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DigitalPanApplicationFlow.name, schema: DigitalPanFlowSchema },
    ]),
  ],
  controllers: [],
  providers: [],
})
export class PanAppFlowModule {}
