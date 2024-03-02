import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ timestamps: true })
export class WhatsappLogs {
  @Prop({ default: "" })
  WhatsappTo: string;

  @Prop({ default: "" })
  msg: string;

  @Prop({ default: "" })
  successResponse: string;

  @Prop({ default: [], type: Array })
  failedResponse: object[];

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type WhatsappLogsDocument = WhatsappLogs & Document;
export const WhatsappLogsSchema = SchemaFactory.createForClass(WhatsappLogs);
