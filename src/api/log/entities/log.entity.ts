import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Log {
  @Prop({ default: '' })
  req: string;

  @Prop({ default: '' })
  userType: string;

  @Prop({ default: '' })
  userId: string;

  @Prop({ default: '' })
  module: string;

  @Prop({ default: '' })
  module_action: string;

  @Prop({ default: '' })
  module_id: string;

  @Prop({ default: true })
  resStatus: boolean;

  @Prop({ default: 0 })
  statusCode: number;

  @Prop({ default: '' })
  remark: string;

  @Prop({ default: '' })
  message: string;

  @Prop({ default: '' })
  requestedIp: string;
}

export type LogDocument = Log & Document;
export const LogSchema = SchemaFactory.createForClass(Log);
