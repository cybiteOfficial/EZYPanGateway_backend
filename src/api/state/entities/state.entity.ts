import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class State {
  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  code: string;
}

export type StateDocument = State & Document;
export const StateSchema = SchemaFactory.createForClass(State);
