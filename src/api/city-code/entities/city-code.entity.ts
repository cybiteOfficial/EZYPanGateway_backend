import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class CityCode {
  @Prop({ required: true, trim: true })
  city: string;

  @Prop({ required: true, trim: true })
  areaCode: string;

  @Prop({ required: true, trim: true })
  aoType: string;

  @Prop({ required: true })
  rangeCode: number;

  @Prop({ required: true })
  aoNo: number;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type CityCodeDocument = CityCode & Document;
export const CityCodeSchema = SchemaFactory.createForClass(CityCode);
