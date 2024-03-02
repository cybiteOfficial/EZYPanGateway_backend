import { UserAuthentication, VerifyToken } from '../../auth/auth.service';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VideoService } from './video.service';
import { VideoController } from './video.controller';
import { Video, VideoSchema } from './entities/video.entity';
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
      { name: Video.name, schema: VideoSchema },
      { name: Log.name, schema: LogSchema },
      { name: User.name, schema: UserSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: UserFlow.name, schema: UserFlowSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
    ]),
  ],
  controllers: [VideoController],
  providers: [VideoService, AddLogFunction, userAuthHelper],
})
export class VideoModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        '/video/add',
        '/video/update',
        '/video/delete',
        '/video/view/admin',
        '/video/change-status',
        '/video/list/pagination',
        '/video/change-showonmobile',
        '/video/admin/view',
      );
  }
}
