import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class InitialName {
  @Prop({ required: true })
  initials: string;
}

export type InitialNameDocument = InitialName & Document;
export const InitialNameSchema = SchemaFactory.createForClass(InitialName);
