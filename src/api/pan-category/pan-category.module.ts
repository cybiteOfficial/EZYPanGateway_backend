import { UserAuthentication } from '../../auth/auth.service';
import { PanCategoryController } from './pan-category.controller';
import { PanCategoryServices } from './pan-category.service';
import { PanCategory, PanCategorySchema } from './entities/pan-category.entity';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AddLogFunction } from '../../helper/addLog';
import { Log, LogSchema } from '../log/entities/log.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { Admin, AdminSchema } from '../admin/entities/admin.entity';
import {
  AdminRole,
  AdminRoleSchema,
} from '../adminrole/entities/adminrole.entity';
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
      { name: PanCategory.name, schema: PanCategorySchema },
      { name: Log.name, schema: LogSchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
    ]),
  ],
  controllers: [PanCategoryController],
  providers: [PanCategoryServices, AddLogFunction, userAuthHelper],
})
export class PanCategoryModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        '/pan-category/update',
        '/pan-category/add',
        '/pan-category/change-status',
        '/pan-category/admin/get-all',
        '/pan-category/get-all',
        '/pan-category/change-status/show-for-guest',
        '/pan-category/change-status/applicable-for-minor',
      );
  }
}
