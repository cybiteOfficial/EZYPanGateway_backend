import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class MenuLinks {
  @Prop({ required: true })
  menuName: string;

  @Prop({ required: true })
  order: number;

  @Prop({ required: true })
  link: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export type MenuLinksDocument = MenuLinks & Document;
export const MenuLinksSchema = SchemaFactory.createForClass(MenuLinks);
