import { UserAuthentication } from '../../auth/auth.service';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StaticPageService } from './static-page.service';
import { StaticPageController } from './static-page.controller';
import { StaticPage, StaticPageSchema } from './entities/static-page.entity';
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
  OtherService,
  OtherServiceSchema,
} from '../other-service/entities/other-service.entity';
import {
  AccessModuleSchema,
  AccessModule,
} from '../accessmodule/entities/access-module.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StaticPage.name, schema: StaticPageSchema },
      { name: Log.name, schema: LogSchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: UserFlow.name, schema: UserFlowSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: OtherService.name, schema: OtherServiceSchema },
    ]),
  ],
  controllers: [StaticPageController],
  providers: [StaticPageService, AddLogFunction, userAuthHelper],
})
export class StaticPageModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        '/static-page/add',
        '/static-page/update',
        '/static-page/delete',
        '/static-page/change-status',
        '/static-page/list/pagination',
        '/static-page/admin/view-with-name',
        '/static-page/admin/get-all',
      );
  }
}
