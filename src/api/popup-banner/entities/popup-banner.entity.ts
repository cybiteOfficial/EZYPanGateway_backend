import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class PopupBanner {
  @Prop({ default: 'popup-banner' })
  fileType: string;

  @Prop({ required: true })
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

export type PopupBannerDocument = PopupBanner & Document;
export const PopupBannerSchema = SchemaFactory.createForClass(PopupBanner);
