import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ timestamps: true })
export class GumastaDistrictConfig {
  @Prop({ default: "", uppercase: true, trim: true })
  state: string;

  @Prop({ default: "", uppercase: true, trim: true })
  district: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type GumastaDistrictConfigDocument = GumastaDistrictConfig & Document;
export const GumastaDistrictConfigSchema = SchemaFactory.createForClass(
  GumastaDistrictConfig
);
