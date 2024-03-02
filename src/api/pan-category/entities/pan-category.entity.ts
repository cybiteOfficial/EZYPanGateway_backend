import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum } from 'class-validator';

export enum categoryCode {
  DSA = 'CAT_DSA',
  PCO = 'CAT_PCO',
  cat_2 = 'CAT_2',
  cat_3 = 'CAT_3',
}

@Schema({ timestamps: true })
export class PanCategory {
  @Prop({ required: true })
  categoryName: string;

  @Prop({ required: true })
  price: number;

  // @Prop({ required: true })
  // guestBasePrice: number;

  @Prop({ default: false })
  applicableForMinor: boolean;

  @Prop({ default: false })
  showForGuest: boolean;

  @Prop({ required: true, enum: categoryCode })
  @IsEnum(categoryCode)
  categoryCode: categoryCode;

  @Prop({ default: true })
  isActive: boolean;
}

export type PanCategoryDocument = PanCategory & Document;
export const PanCategorySchema = SchemaFactory.createForClass(PanCategory);
