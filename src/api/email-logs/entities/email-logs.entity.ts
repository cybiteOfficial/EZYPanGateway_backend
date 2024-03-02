import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class EmailLogs {
  @Prop({ default: '' })
  emailTo: string;

  @Prop({ default: '' })
  emailType: string;
  @Prop({ default: '' })
  successResponse: string;

  @Prop({ default: [], type: Array })
  failedResponse: object[];

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type EmailLogsDocument = EmailLogs & Document;
export const EmailLogsSchema = SchemaFactory.createForClass(EmailLogs);
