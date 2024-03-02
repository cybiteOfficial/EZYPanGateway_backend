import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class VideoTutorial {
  @Prop({ required: true })
  videoHeading: string;

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

export type VideoTutorialDocument = VideoTutorial & Document;
export const VideoTutorialSchema = SchemaFactory.createForClass(VideoTutorial);
