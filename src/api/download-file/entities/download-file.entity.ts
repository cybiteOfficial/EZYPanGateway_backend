import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class DownloadFile {
  @Prop({ required: true })
  fileTitle: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type DownloadFileDocument = DownloadFile & Document;
export const DownloadFileSchema = SchemaFactory.createForClass(DownloadFile);
