import { UserAuthentication, VerifyToken } from '../../auth/auth.service';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FooterService } from './footer.service';
import { FooterController } from './footer.controller';
import { Footer, FooterSchema } from './entities/footer.entity';
import {
  FooterCategory,
  FooterCategorySchema,
} from '../footer-category/entities/footer-category.entity';
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
    MongooseModule.forFeature([{ name: Footer.name, schema: FooterSchema }]),
    MongooseModule.forFeature([
      { name: FooterCategory.name, schema: FooterCategorySchema },
      { name: Log.name, schema: LogSchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: UserFlow.name, schema: UserFlowSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
    ]),
  ],
  controllers: [FooterController],
  providers: [FooterService, AddLogFunction, userAuthHelper],
})
export class FooterModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        '/footer/add',
        '/footer/delete',
        '/footer/change-status',
        '/footer/update',
        '/footer/view/admin',
        '/footer/admin/get-all',
      );
  }
}
