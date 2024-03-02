import { UserAuthentication } from '../../auth/auth.service';
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from '../all-access-fields/entites/all-access-module.entity';
import { Admin, AdminSchema } from '../admin/entities/admin.entity';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { monthExcelSheetService } from './monthly-excel-sheet.service';
import { monthlyExcelSheetController } from './monthly-excel-sheet.controller';
import { Log, LogSchema } from '../log/entities/log.entity';
import {
  AdminRole,
  AdminRoleSchema,
} from '../adminrole/entities/adminrole.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { AddLogFunction } from '../../helper/addLog';
import { userAuthHelper } from '../../auth/auth.helper';
import {
  AccessModuleSchema,
  AccessModule,
} from '../accessmodule/entities/access-module.entity';
import {
  PanAppSchema,
  PanApplication,
} from '../panapplications/entities/pan.entity';
import {
  DigitalSign,
  DigitalSignSchema,
} from '../digital-sign/entities/digital-sign.entity';
import {
  MsmeApplication,
  MsmeApplicationSchema,
} from '../msme-application/entities/msme-application.entity';
import {
  GumastaApplication,
  GumastaApplicationSchema,
} from '../gumasta-application/entities/gumasta-application.entity';
import {
  ItrApplication,
  ItrApplicationSchema,
} from '../itr-application/entities/itr-application.entity';
import {
  UserCommission,
  UserCommissionSchema,
} from '../userCommission/entities/user-commission.entity';
import { EmailService } from 'src/helper/sendEmail';
import {
  EmailTemplate,
  EmailTemplateSchema,
} from '../email-templates/entities/email-template.module';
import {
  EmailLogs,
  EmailLogsSchema,
} from '../email-logs/entities/email-logs.entity';
import { sendMonthlySheetHelper } from './monthly-excel-sheet.helper';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: User.name, schema: UserSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: Log.name, schema: LogSchema },
      { name: PanApplication.name, schema: PanAppSchema },
      { name: DigitalSign.name, schema: DigitalSignSchema },
      { name: MsmeApplication.name, schema: MsmeApplicationSchema },
      { name: GumastaApplication.name, schema: GumastaApplicationSchema },
      { name: ItrApplication.name, schema: ItrApplicationSchema },
      { name: UserCommission.name, schema: UserCommissionSchema },
      { name: EmailTemplate.name, schema: EmailTemplateSchema },
      { name: EmailLogs.name, schema: EmailLogsSchema },
    ]),
  ],
  controllers: [monthlyExcelSheetController],
  providers: [
    monthExcelSheetService,
    AddLogFunction,
    userAuthHelper,
    EmailService,
    sendMonthlySheetHelper,
  ],
})
export class monthlyExcelSheetModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply().forRoutes();
  }
}
