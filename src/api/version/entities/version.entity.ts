import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Version {
  @Prop({ required: true })
  version: string;

  @Prop({ default: true })
  isForce: boolean;
}

export type VersionDocument = Version & Document;
export const VersionSchema = SchemaFactory.createForClass(Version);
