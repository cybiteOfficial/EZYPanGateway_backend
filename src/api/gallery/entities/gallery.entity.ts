import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Gallery {
  @Prop({ default: 'GALLERY' })
  fileType: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  category: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true })
  image: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type GalleryDocument = Gallery & Document;
export const GallerySchema = SchemaFactory.createForClass(Gallery);
