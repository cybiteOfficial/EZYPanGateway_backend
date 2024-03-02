import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { userAuthHelper } from '../../auth/auth.helper';
import { UserAuthentication } from '../../auth/auth.service';
import { AddLogFunction } from '../../helper/addLog';
import { Admin, AdminSchema } from '../admin/entities/admin.entity';
import {
  AdminRole,
  AdminRoleSchema,
} from '../adminrole/entities/adminrole.entity';
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from '../all-access-fields/entites/all-access-module.entity';
import { Log, LogSchema } from '../log/entities/log.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { ContactUsEnquiryController } from './contact-us-enquiry.controller';
import { ContactUsEnquiryService } from './contact-us-enquiry.service';
import {
  ContactUsEnquiry,
  ContactUsEnquirySchema,
} from './entitities/contact-us-enquiry.entity';
import {
  AccessModuleSchema,
  AccessModule,
} from '../accessmodule/entities/access-module.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Log.name, schema: LogSchema },
      { name: ContactUsEnquiry.name, schema: ContactUsEnquirySchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
    ]),
  ],
  controllers: [ContactUsEnquiryController],
  providers: [ContactUsEnquiryService, AddLogFunction, userAuthHelper],
})
export class ContactUsEnquiryModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes('/contact-us-enquiry/list/pagination');
  }
}
