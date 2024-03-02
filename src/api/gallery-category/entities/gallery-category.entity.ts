import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class GalleryCategory {
  @Prop({ required: true })
  title: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type GalleryCategoryDocument = GalleryCategory & Document;
export const GalleryCategorySchema =
  SchemaFactory.createForClass(GalleryCategory);
