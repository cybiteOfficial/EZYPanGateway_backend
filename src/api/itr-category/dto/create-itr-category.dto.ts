import { categoryCode } from '../entities/itr-category.entity';

export class CreateItrCategoryDto {
  categoryName: string;
  applicableForMinor: boolean;
  categoryCode: categoryCode;
  showForGuest: boolean;
  price: number;
  isActive: boolean;
}
