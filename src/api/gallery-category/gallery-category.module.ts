import { UserAuthentication, VerifyToken } from '../../auth/auth.service';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GalleryCategoryService } from './gallery-category.service';
import { GalleryCategoryController } from './gallery-category.controller';
import {
  GalleryCategory,
  GalleryCategorySchema,
} from './entities/gallery-category.entity';
import { AddLogFunction } from '../../helper/addLog';
import { Log, LogSchema } from '../log/entities/log.entity';
import { userAuthHelper } from '../../auth/auth.helper';
import { Admin, AdminSchema } from '../admin/entities/admin.entity';
import {
  AdminRole,
  AdminRoleSchema,
} from '../adminrole/entities/adminrole.entity';
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from '../all-access-fields/entites/all-access-module.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import {
  UserFlow,
  UserFlowSchema,
} from '../user-flow/entities/user-flow.entity';
import {
  AccessModuleSchema,
  AccessModule,
} from '../accessmodule/entities/access-module.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GalleryCategory.name, schema: GalleryCategorySchema },
      { name: Log.name, schema: LogSchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: UserFlow.name, schema: UserFlowSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
    ]),
  ],
  controllers: [GalleryCategoryController],
  providers: [GalleryCategoryService, AddLogFunction, userAuthHelper],
})
export class GalleryCategoryModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        '/gallery-category/add',
        '/gallery-category/update',
        '/gallery-category/delete',
        '/gallery-category/change-status',
        '/gallery-category/list/pagination',
        '/gallery-category/admin/get-all',
      );
  }
}
