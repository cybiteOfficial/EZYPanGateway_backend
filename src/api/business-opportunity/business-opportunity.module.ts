import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AddLogFunction } from '../../helper/addLog';
import { Log, LogSchema } from '../log/entities/log.entity';
import { BusinessOpportunityService } from './business-opportunity.service';
import { BusinessOpportunityController } from './business-opportunity.controller';
import {
  BusinessOpportunity,
  BusinessOpportunitySchema,
} from './entities/business-opportunity.entity';
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
      { name: BusinessOpportunity.name, schema: BusinessOpportunitySchema },
      { name: User.name, schema: UserSchema },
      { name: Log.name, schema: LogSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
    ]),
  ],
  controllers: [BusinessOpportunityController],
  providers: [BusinessOpportunityService, AddLogFunction, userAuthHelper],
})
export class BusinessOpportunityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        '/business-opportunity/add',
        '/business-opportunity/update',
        '/business-opportunity/delete',
        'business-opportunity/admin/view',
        '/business-opportunity/change-status',
        '/business-opportunity/list/pagination',
      );
  }
}
