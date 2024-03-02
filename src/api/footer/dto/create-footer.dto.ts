import { IsObject } from 'class-validator';

export class CreateFooterDto {
  footerlinks: {
    categoryName: string;
    order: number;
    links: link[];
    isDeleted: boolean;
    isActive: boolean;
  };
}

class link {
  name: string;
  link: string;
  isActive: boolean;
}
