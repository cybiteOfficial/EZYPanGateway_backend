import { UserAuthentication } from '../../auth/auth.service';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PopupBannerService } from './popup-banner.service';
import { PopupBannerController } from './popup-banner.controller';
import { PopupBanner, PopupBannerSchema } from './entities/popup-banner.entity';
import { ImageMiddleware } from '../../middleware/image.middleware';
import { AddLogFunction } from '../../helper/addLog';
import { Log, LogSchema } from '../log/entities/log.entity';
import { Admin, AdminSchema } from '../admin/entities/admin.entity';
import { Otp, OtpSchema } from '../otp/entity/create-otp.entity';
import {
  AdminRole,
  AdminRoleSchema,
} from '../adminrole/entities/adminrole.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import {
  UserFlow,
  UserFlowSchema,
} from '../user-flow/entities/user-flow.entity';
import { userAuthHelper } from '../../auth/auth.helper';
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from '../all-access-fields/entites/all-access-module.entity';
import {
  AccessModuleSchema,
  AccessModule,
} from '../accessmodule/entities/access-module.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PopupBanner.name, schema: PopupBannerSchema },
      { name: Log.name, schema: LogSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: User.name, schema: UserSchema },
      { name: UserFlow.name, schema: UserFlowSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
    ]),
  ],
  controllers: [PopupBannerController],
  providers: [PopupBannerService, AddLogFunction, userAuthHelper],
})
export class PopupBannerModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        '/popup-banner/add',
        '/popup-banner/view/admin/',
        '/popup-banner/update',
        '/popup-banner/admin/get-all',
        '/popup-banner/delete',
        '/popup-banner/change-status',
      );
    consumer
      .apply(ImageMiddleware)
      .forRoutes('popup-banner/add', 'popup-banner/update');
  }
}
