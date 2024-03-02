import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { serviceType } from '../../price-config/entities/price-config.entity';

@Schema({ timestamps: true })
export class BusinessOpportunity {
  @Prop({ required: true, enum: serviceType })
  serviceName: serviceType;

  @Prop({ required: true, trim: true })
  commission: string;

  @Prop({ required: true, trim: true })
  retailerReward: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type BusinessOpportunityDocument = BusinessOpportunity & Document;
export const BusinessOpportunitySchema =
  SchemaFactory.createForClass(BusinessOpportunity);
