import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AddLogFunction } from '../../helper/addLog';
import { Log, LogSchema } from '../log/entities/log.entity';
import { DownloadFileService } from './download-file.service';
import { DownloadFileController } from './download-file.controller';
import {
  DownloadFile,
  DownloadFileSchema,
} from './entities/download-file.entity';
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
      { name: DownloadFile.name, schema: DownloadFileSchema },
      { name: User.name, schema: UserSchema },
      { name: Log.name, schema: LogSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
    ]),
  ],
  controllers: [DownloadFileController],
  providers: [DownloadFileService, AddLogFunction, userAuthHelper],
})
export class DownloadFileModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        '/download-file/add',
        '/download-file/update',
        '/download-file/delete',
        '/download-file/list/web',
        '/download-file/view',
        '/download-file/change-status',
        '/download-file/list/pagination',
      );
  }
}
