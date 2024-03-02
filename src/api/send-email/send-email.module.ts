import { UserAuthentication } from '../../auth/auth.service';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SendEmailService } from './send-email.service';
import { SendEmailController } from './send-email.controller';
import { SendEmail, SendEmailSchema } from './entities/send-email.entity';
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
import { EmailService } from '../../helper/sendEmail';
import {
  AccessModuleSchema,
  AccessModule,
} from '../accessmodule/entities/access-module.entity';
import {
  EmailTemplate,
  EmailTemplateSchema,
} from '../../api/email-templates/entities/email-template.module';
import {
  SmsTemplate,
  SmsTemplateSchema,
} from '../sms-templates/entities/sms-templates.entity';
import { smsTemplateService } from '../../helper/smsTemplates';
import {
  EmailLogs,
  EmailLogsSchema,
} from '../email-logs/entities/email-logs.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SendEmail.name, schema: SendEmailSchema },
      { name: Log.name, schema: LogSchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: UserFlow.name, schema: UserFlowSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: EmailTemplate.name, schema: EmailTemplateSchema },
      { name: SmsTemplate.name, schema: SmsTemplateSchema },
      { name: EmailLogs.name, schema: EmailLogsSchema },
    ]),
  ],
  controllers: [SendEmailController],
  providers: [
    SendEmailService,
    AddLogFunction,
    userAuthHelper,
    EmailService,
    smsTemplateService,
  ],
})
export class SendEmailModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserAuthentication).forRoutes('/send-email/add');
  }
}
