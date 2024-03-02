import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Video {
  @Prop({ required: true })
  videoLink: string;

  @Prop({ required: true })
  order: number;

  @Prop({ default: true })
  showOnMobile: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type VideoDocument = Video & Document;
export const VideoSchema = SchemaFactory.createForClass(Video);
