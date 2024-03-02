import { UserAuthentication } from '../../auth/auth.service';
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from '../all-access-fields/entites/all-access-module.entity';
import { Admin, AdminSchema } from '../admin/entities/admin.entity';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RewardService } from './userAndServiceWiseRewardConfig.service';
import { RewardController } from './userAndServiceWiseRewardConfig.controller';
import {
  userAndServiceWiseRewardConfig,
  userAndServiceWiseRewardConfigSchema,
} from './entities/userAndServiceWiseRewardConfig.entity';
import { Log, LogSchema } from '../log/entities/log.entity';
import {
  AdminRole,
  AdminRoleSchema,
} from '../adminrole/entities/adminrole.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { AddLogFunction } from '../../helper/addLog';
import { userAuthHelper } from '../../auth/auth.helper';
import {
  PriceConfig,
  PriceConfigSchema,
} from '../price-config/entities/price-config.entity';
import {
  userAndServiceWiseRewardConfigHistory,
  userAndServiceWiseRewardConfigHistorySchema,
} from '../userAndServiceWiseRewardConfigHistory/entities/userAndServiceWiseRewardConfigHistory.entity';
import {
  AccessModuleSchema,
  AccessModule,
} from '../accessmodule/entities/access-module.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: userAndServiceWiseRewardConfig.name,
        schema: userAndServiceWiseRewardConfigSchema,
      },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: User.name, schema: UserSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: Log.name, schema: LogSchema },
      { name: PriceConfig.name, schema: PriceConfigSchema },
      {
        name: userAndServiceWiseRewardConfigHistory.name,
        schema: userAndServiceWiseRewardConfigHistorySchema,
      },
    ]),
  ],
  controllers: [RewardController],
  providers: [RewardService, AddLogFunction, userAuthHelper],
})
export class RewardModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        '/reward/update',
        '/reward/get-all',
        '/reward/list/pagination',
        '/reward/admin/view',
      );
  }
}
