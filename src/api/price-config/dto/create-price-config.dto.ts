import { serviceType } from '../entities/price-config.entity';

export class CreatePriceConfigDto {
  serviceName: string;
  serviceType: serviceType;
  price: number;
  guestConvenienceprice: number;
  convenienceprice: number;
  isActive: boolean;
  guestBaseprice: string;
}
