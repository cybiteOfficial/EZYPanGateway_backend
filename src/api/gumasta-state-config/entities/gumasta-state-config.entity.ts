import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ timestamps: true })
export class GumastaStateConfig {
  @Prop({ default: "", uppercase: true, trim: true })
  state: string;

  @Prop({ default: false, trim: true })
  isDeleted: boolean;

  @Prop({ default: true, trim: true })
  isActive: boolean;
}

export type GumastaStateConfigDocument = GumastaStateConfig & Document;
export const GumastaStateConfigSchema =
  SchemaFactory.createForClass(GumastaStateConfig);
