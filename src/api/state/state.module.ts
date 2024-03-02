import { MongooseModule } from '@nestjs/mongoose';
import { State, StateSchema } from './entities/state.entity';
import { StateController } from './state.controller';
import { StateService } from './state.service';
import { VerifyToken } from '../../auth/auth.service';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AddLogFunction } from '../../helper/addLog';
import { Log, LogSchema } from '../log/entities/log.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: State.name, schema: StateSchema },
      { name: Log.name, schema: LogSchema },
    ]),
  ],
  controllers: [StateController],
  providers: [StateService, AddLogFunction],
})
export class StateModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(VerifyToken).forRoutes('state/admin/get-all');
  }
}
