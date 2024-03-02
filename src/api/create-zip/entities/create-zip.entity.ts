import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class ZipFile {
  @Prop({ required: true })
  filePath: string;

  @Prop({ default: true })
  lastUsed: boolean;
}

export type ZipFileDocument = ZipFile & Document;
export const ZipFileSchema = SchemaFactory.createForClass(ZipFile);
