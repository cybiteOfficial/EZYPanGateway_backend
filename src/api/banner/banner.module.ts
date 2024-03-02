import { UserAuthentication } from '../../auth/auth.service';
import { VerifyToken } from '../../auth/auth.service';
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from '../all-access-fields/entites/all-access-module.entity';
import { Admin, AdminSchema } from '../admin/entities/admin.entity';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BannerService } from './banner.service';
import { BannerController } from './banner.controller';
import { Banner, BannerSchema } from './entities/banner.entity';
import { Log, LogSchema } from '../log/entities/log.entity';
import { ImageMiddleware } from '../../middleware/image.middleware';
import {
  AdminRole,
  AdminRoleSchema,
} from '../adminrole/entities/adminrole.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { AddLogFunction } from '../../helper/addLog';
import { userAuthHelper } from '../../auth/auth.helper';
import {
  AccessModule,
  AccessModuleSchema,
} from '../accessmodule/entities/access-module.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Banner.name, schema: BannerSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: User.name, schema: UserSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: Log.name, schema: LogSchema },
    ]),
  ],
  controllers: [BannerController],
  providers: [BannerService, AddLogFunction, userAuthHelper],
})
export class BannerModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        '/banner/add',
        '/banner/change-showonweb',
        '/banner/update',
        '/banner/delete',
        '/banner/change-status',
        '/banner/list/pagination',
        '/banner/admin/view',
      );

    consumer.apply(ImageMiddleware).forRoutes('/banner/add', '/banner/update');
  }
}
