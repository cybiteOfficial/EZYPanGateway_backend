import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InitialNameService } from './initial-name.service';
import { InitialNameController } from './initial-name.controller';
import { InitialName, InitialNameSchema } from './entities/initial-name.entity';
import { AddLogFunction } from '../../helper/addLog';
import { Log, LogSchema } from '../log/entities/log.entity';
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
      { name: InitialName.name, schema: InitialNameSchema },
      { name: Log.name, schema: LogSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: User.name, schema: UserSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
    ]),
  ],
  controllers: [InitialNameController],
  providers: [InitialNameService, AddLogFunction, userAuthHelper],
})
export class InitialNameModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserAuthentication).forRoutes('/initial-name/get-all');
  }
}
