import { UserAuthentication } from '../../auth/auth.service';
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from '../all-access-fields/entites/all-access-module.entity';
import { Admin, AdminSchema } from '../admin/entities/admin.entity';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RetailerRegisterRewardService } from './retailer-register-reward.service';
import { RetailerRegisterRewardController } from './retailer-register-reward.controller';
import {
  RetailerRegisterReward,
  RetailerRegisterRewardSchema,
} from './entities/retailer-register-reward.entity';
import { Log, LogSchema } from '../log/entities/log.entity';
import {
  AdminRole,
  AdminRoleSchema,
} from '../adminrole/entities/adminrole.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { AddLogFunction } from '../../helper/addLog';
import { userAuthHelper } from '../../auth/auth.helper';
import {
  RewardHistory,
  RewardHistorySchema,
} from '../rewardHistory/entities/rewardHistory.entity';
import {
  RetailerRewardUpdateHistory,
  RetailerRewardUpdateHistorySchema,
} from '../retailer-reward-update-history/entities/retailer-reward-update-history.entity';
import {
  AccessModuleSchema,
  AccessModule,
} from '../accessmodule/entities/access-module.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: User.name, schema: UserSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: Log.name, schema: LogSchema },
      { name: RewardHistory.name, schema: RewardHistorySchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      {
        name: RetailerRegisterReward.name,
        schema: RetailerRegisterRewardSchema,
      },
      {
        name: RetailerRewardUpdateHistory.name,
        schema: RetailerRewardUpdateHistorySchema,
      },
    ]),
  ],
  controllers: [RetailerRegisterRewardController],
  providers: [RetailerRegisterRewardService, AddLogFunction, userAuthHelper],
})
export class RetailerRegisterRewardModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        '/retailer-register-reward/update',
        '/retailer-register-reward/get-all',
        '/retailer-register-reward/list/pagination',
      );
  }
}
