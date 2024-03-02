import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { serviceType } from '../../price-config/entities/price-config.entity';
import { IsEnum } from 'class-validator';

@Schema({ timestamps: true })
export class Commission {
  @Prop({ required: true, enum: serviceType })
  @IsEnum(serviceType)
  serviceName: serviceType;

  @Prop({ required: true, trim: true })
  commissionName: string;

  @Prop({ required: true })
  commissionForDistributor: number;

  @Prop({ required: true })
  minimumApplications: number;

  @Prop({ default: 0 })
  commissionForRetailer: number;

  @Prop({ default: 0 })
  commissionForGuest: number;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type CommissionDocument = Commission & Document;
export const CommissionSchema = SchemaFactory.createForClass(Commission);
