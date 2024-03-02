import { UserAuthentication } from "../../auth/auth.service";
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from "../all-access-fields/entites/all-access-module.entity";
import { Admin, AdminSchema } from "../admin/entities/admin.entity";
import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { RewardPointService } from "./rewardValueConfig.service";
import { RewardPointController } from "./rewardValueConfig.controller";
import {
  RewardValueConfig,
  RewardValueConfigSchema,
} from "./entities/rewardValueConfig.entity";
import { Log, LogSchema } from "../log/entities/log.entity";
import {
  AdminRole,
  AdminRoleSchema,
} from "../adminrole/entities/adminrole.entity";
import { User, UserSchema } from "../user/entities/user.entity";
import { AddLogFunction } from "../../helper/addLog";
import { userAuthHelper } from "../../auth/auth.helper";
import {
  RewardValueConfigHistory,
  RewardValueConfigHistorySchema,
} from "../rewardValueConfigHistory/entities/rewardValueConfigHistory.entity";
import {
  RewardHistory,
  RewardHistorySchema,
} from "../rewardHistory/entities/rewardHistory.entity";
import {
  UserRewardWallet,
  UserRewardWalletSchema,
} from "../userRewardWallet/entities/userRewardWallet.entity";
import {
  AccessModuleSchema,
  AccessModule,
} from "../accessmodule/entities/access-module.entity";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RewardValueConfig.name, schema: RewardValueConfigSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: User.name, schema: UserSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: Log.name, schema: LogSchema },
      {
        name: RewardValueConfigHistory.name,
        schema: RewardValueConfigHistorySchema,
      },
      { name: RewardHistory.name, schema: RewardHistorySchema },
      { name: UserRewardWallet.name, schema: UserRewardWalletSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
    ]),
  ],
  controllers: [RewardPointController],
  providers: [RewardPointService, AddLogFunction, userAuthHelper],
})
export class RewardPointModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        "/reward-point/update",
        "/reward-point/get-all",
        "/reward-point/list/pagination",
        "/reward-point/user-reward/pagination",
        "/reward-point/user-reward/get-all",
        "/reward-point/user-reward/total",
        "/reward-point/user-reward/total-value",
        "/reward-point/history",
        "/reward-point/add",
        "/reward-point/history/update",
        "/reward-point/view",
        "/reward-point/delete",
        "/reward-point/admin/get-wallet",
        "/reward-point/admin/update-wallet"
      );
  }
}
