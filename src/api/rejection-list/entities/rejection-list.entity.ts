import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class RejectionList {
  @Prop({ required: true })
  rejectionMsg: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type RejectionListDocument = RejectionList & Document;
export const RejectionListSchema = SchemaFactory.createForClass(RejectionList);
