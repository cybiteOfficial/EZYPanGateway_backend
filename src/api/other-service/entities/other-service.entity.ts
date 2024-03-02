import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class OtherService {
  @Prop({ required: true })
  serviceName: string;

  @Prop({ required: true })
  serviceDescription: string;

  @Prop({ required: true })
  staticPageId: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;
}

export type OtherServiceDocument = OtherService & Document;
export const OtherServiceSchema = SchemaFactory.createForClass(OtherService);
