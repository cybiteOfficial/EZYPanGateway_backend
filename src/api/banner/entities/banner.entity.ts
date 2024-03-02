import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Banner {
  @Prop({ default: 'BANNER' })
  fileType: string;

  @Prop({ required: true, trim: true })
  image: string;

  @Prop({ default: true })
  showOnWeb: boolean;

  @Prop({ default: true })
  showOnMobile: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type BannerDocument = Banner & Document;
export const BannerSchema = SchemaFactory.createForClass(Banner);
