import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class AdminRole {
  @Prop({ required: true, trim: true })
  roleName: string;

  @Prop({ default: [], type: Array })
  modules: {
    moduleGroup: string;
    actions: string;
    fields: { fieldName: string; displayName: string };
  }[];
}

export type AdminRoleDocument = AdminRole & Document;
export const AdminRoleSchema = SchemaFactory.createForClass(AdminRole);
