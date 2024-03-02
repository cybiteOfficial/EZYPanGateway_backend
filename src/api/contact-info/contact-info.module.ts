import { UserAuthentication, VerifyToken } from '../../auth/auth.service';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactInfoService } from './contact-info.service';
import { ContactInfoController } from './contact-info.controller';
import { ContactInfo, ContactInfoSchema } from './entities/contact-info.entity';
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
      { name: ContactInfo.name, schema: ContactInfoSchema },
      { name: Log.name, schema: LogSchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: UserFlow.name, schema: UserFlowSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
    ]),
  ],
  controllers: [ContactInfoController],
  providers: [ContactInfoService, AddLogFunction, userAuthHelper],
})
export class ContactInfoModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        '/contact-info/add',
        '/contact-info/update',
        '/contact-info/change-status',
        '/contact-info/delete',
        '/contact-info/view/admin',
        '/contact-info/admin/get-all',
      );
  }
}
