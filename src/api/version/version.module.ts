import { UserAuthentication } from '../../auth/auth.service';
import {
  AllAccessFields,
  AllAccessFieldsSchema,
} from '../all-access-fields/entites/all-access-module.entity';
import { Admin, AdminSchema } from '../admin/entities/admin.entity';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VersionService } from './version.service';
import { VersionController } from './version.controller';
import { Version, VersionSchema } from './entities/version.entity';
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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Version.name, schema: VersionSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: User.name, schema: UserSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
      { name: Log.name, schema: LogSchema },
    ]),
  ],
  controllers: [VersionController],
  providers: [VersionService, AddLogFunction, userAuthHelper],
})
export class VersionModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
  }
}
