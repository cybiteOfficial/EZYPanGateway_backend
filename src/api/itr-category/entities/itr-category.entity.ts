import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEnum } from 'class-validator';

export enum categoryCode
{
  DSA = 'CAT_DSA',
  PCO = 'CAT_PCO',
}

@Schema( { timestamps: true } )
export class ItrCategory
{
  @Prop( { required: true } )
  categoryName: string;

  @Prop( { required: true } )
  price: number;

  @Prop( { default: false } )
  showForGuest: boolean;

  @Prop( { default: false } )
  applicableForMinor: boolean;

  @Prop( { required: true, enum: categoryCode } )
  @IsEnum( categoryCode )
  categoryCode: categoryCode;

  @Prop( { default: true } )
  isActive: boolean;
}

export type ItrCategoryDocument = ItrCategory & Document;
export const ItrCategorySchema = SchemaFactory.createForClass( ItrCategory );
