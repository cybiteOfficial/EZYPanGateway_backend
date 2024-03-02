import { categoryCode } from '../entities/pan-category.entity';

export class CreatePanCategoryDto {
  categoryName: string;
  categoryCode: categoryCode;
  price: number;
  // guestBasePrice: number;
  isActive: boolean;
  showForGuest: boolean;
  applicableForMinor: boolean;
}
