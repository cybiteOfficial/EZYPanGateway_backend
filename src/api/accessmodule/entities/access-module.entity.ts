/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class AccessModule {
  @Prop({ required: true })
  moduleName: string;

  @Prop({ required: true })
  moduleDisplayName: string;

  @Prop({ required: true })
  moduleGroup: string;

  @Prop({ required: true })
  moduleGroupDisplayName: string;

  @Prop({ required: true })
  groupRank: number;

  @Prop({ required: true })
  moduleRank: number;

  @Prop({ required: true })
  method: string;

  @Prop({ required: true })
  url: string;

  @Prop({ default: false })
  isadminApi: boolean;

  @Prop({ default: false })
  iswebApi: boolean;

  @Prop({ default: false })
  skip: boolean;
}

export type AccessModuleDocument = AccessModule & Document;
export const AccessModuleSchema = SchemaFactory.createForClass(AccessModule);
