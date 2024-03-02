import { Column } from "typeorm";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ timestamps: true })
export class Footer {
  @Prop({ type: Array })
  footerlinks: {
    sort(arg0: (a: any, b: any) => number): unknown;
    categoryName: string;
    order: number;
    links: link[];
  };
  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

class link {
  name: string;
  link: string;
  isActive: boolean;
}

export type FooterDocument = Footer & Document;
export const FooterSchema = SchemaFactory.createForClass(Footer);
