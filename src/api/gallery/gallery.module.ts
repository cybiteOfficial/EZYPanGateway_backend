import { ImageMiddleware } from '../../middleware/image.middleware';
import { UserAuthentication } from '../../auth/auth.service';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GalleryService } from './gallery.service';
import { GalleryController } from './gallery.controller';
import { Gallery, GallerySchema } from './entities/gallery.entity';
import {
  GalleryCategory,
  GalleryCategorySchema,
} from '../gallery-category/entities/gallery-category.entity';
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
    MongooseModule.forFeature([{ name: Gallery.name, schema: GallerySchema }]),
    MongooseModule.forFeature([
      { name: GalleryCategory.name, schema: GalleryCategorySchema },
      { name: Log.name, schema: LogSchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: UserFlow.name, schema: UserFlowSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: AccessModule.name, schema: AccessModuleSchema },
      { name: AllAccessFields.name, schema: AllAccessFieldsSchema },
    ]),
  ],
  controllers: [GalleryController],
  providers: [GalleryService, AddLogFunction, userAuthHelper],
})
export class GalleryModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthentication)
      .forRoutes(
        '/gallery/add',
        '/gallery/update',
        '/gallery/delete',
        '/gallery/change-status',
        '/gallery/list/pagination',
        'gallery/admin/getallwithcategories',
      );
    consumer
      .apply(ImageMiddleware)
      .forRoutes('/gallery/add', '/gallery/update');
  }
}
