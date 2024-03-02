import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PendingAppService } from './pending-app.service';
import { PendingAppController } from './pending-app.controller';
import {
  PanApplication,
  PanAppSchema,
} from '../panapplications/entities/pan.entity';
import {
  ItrApplication,
  ItrApplicationSchema,
} from '../itr-application/entities/itr-application.entity';
import {
  DigitalSign,
  DigitalSignSchema,
} from '../digital-sign/entities/digital-sign.entity';
import {
  GumastaApplication,
  GumastaApplicationSchema,
} from '../gumasta-application/entities/gumasta-application.entity';
import {
  MsmeApplication,
  MsmeApplicationSchema,
} from '../msme-application/entities/msme-application.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { UserAuthentication, VerifyToken } from '../../auth/auth.service';
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
      { name: PanApplication.name, schema: PanAppSchema },
      { name: ItrApplication.name, schema: ItrApplicationSchema },
      { name: DigitalSign.name, schema: DigitalSignSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: GumastaApplication.name, schema: GumastaApplicationSchema },
      { name: MsmeApplication.name, schema: MsmeApplicationSchema },
      { name: Log.name, schema: LogSchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: UserFlow.name, schema: UserFlowSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
    ]),
  ],
  controllers: [PendingAppController],
  providers: [PendingAppService, AddLogFunction, userAuthHelper],
})
export class PendingAppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserAuthentication).forRoutes('pending-app/get-all');
  }
}
