import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class FooterCategory {
  @Prop({ required: true })
  title: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type FooterCategoryDocument = FooterCategory & Document;
export const FooterCategorySchema =
  SchemaFactory.createForClass(FooterCategory);
