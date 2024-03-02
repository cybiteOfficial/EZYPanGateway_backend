import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserFlow, UserFlowSchema } from './entities/user-flow.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserFlow.name, schema: UserFlowSchema },
    ]),
  ],
  controllers: [],
  providers: [],
})
export class UserFlowModule {}
