/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class FileUpload {
  @Prop({ required: true })
  fileType: string;

  @Prop({ required: true })
  image: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type FileUploadDocument = FileUpload & Document;
export const FileUploadSchema = SchemaFactory.createForClass(FileUpload);
