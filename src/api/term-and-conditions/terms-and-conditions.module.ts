import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AddLogFunction } from '../../helper/addLog';
import { Log, LogSchema } from '../log/entities/log.entity';
import { TermsAndConditionsService } from './terms-and-conditions.service';
import { TermsAndConditionsController } from './terms-and-conditions.controller';
import {
  TermsAndConditions,
  TermsAndConditionsSchema,
} from './entities/terms-and-conditions.entity';
import {
  AdminRole,
  AdminRoleSchema,
} from '../adminrole/entities/adminrole.entity';
import { Admin, AdminSchema } from '../admin/entities/admin.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { UserAuthentication } from '../../auth/auth.service';
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
      { name: Log.name, schema: LogSchema },
      { name: TermsAndConditions.name, schema: TermsAndConditionsSchema },
      { name: User.name, schema: UserSchema },
      { name: Log.name, schema: LogSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
    ]),
  ],
  controllers: [TermsAndConditionsController],
  providers: [TermsAndConditionsService, AddLogFunction, userAuthHelper],
})
export class TermsAndConditionsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserAuthentication).forRoutes(
      // '/terms-and-conditions/add',
      '/terms-and-conditions/update',
      '/terms-and-conditions/get-all',
    );
  }
}
