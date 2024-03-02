import { ObjectId } from 'mongoose';
import { VerifyStatus } from '../entities/user.entity';
import { Role } from '../entities/user.entity';

export interface CategoryDto {
  panCategories: ObjectId[];
}

export class CreateUserDto {
  name: string;
  email: string;
  mobileNumber: string;
  dob: string;
  fatherName: string;
  firmName: string;
  address: string;
  area: string;
  cityVillageName: string;
  district: string;
  pincode: number;
  state: string;
  adhaarCardImage: string;
  panCardImage: string;
  cancelChequeImage: string;
  declarationFormPhotoUrl: string;
  password: string;
  confirmPassword: string;
  userType: Role;
  sjbtCode: string;
  rejectionReason: string;
  status: VerifyStatus;
  panNumber: string;
  role: string;
  isProfileComplete: boolean;
  isAppliedForDistributor: boolean;
  isDeleted: boolean;
  isActive: boolean;
  isVerified: boolean;
  emailVerified: boolean;
  mobileNumberVerified: boolean;
  allDistributor: { distributorId: ObjectId; sjbtCode: string }[];
  category: { panCategories: ObjectId[]; itrCategories: ObjectId[] };
  service: string[];
}

export class ChangeStatusDto {
  requestedStatus: VerifyStatus;
}
