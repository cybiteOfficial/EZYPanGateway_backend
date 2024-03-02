import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class AllAccessFields {
  @Prop({ required: true, trim: true })
  moduleGroup: string;

  @Prop({ default: [], type: Array })
  fields: {
    fieldName: string;
    displayName: string;
  }[];

  @Prop({ required: true, type: Array })
  default_fields: string[];
}

export type AllAccessFieldsDocument = AllAccessFields & Document;
export const AllAccessFieldsSchema =
  SchemaFactory.createForClass(AllAccessFields);
