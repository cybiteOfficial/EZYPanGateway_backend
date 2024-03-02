import { ObjectId } from 'mongoose';
import { VerifyStatus } from '../../user/entities/user.entity';
import { Role } from '../../user/entities/user.entity';

export interface CategoryDto
{
    panCategories: ObjectId[];
}

export class ApplyForDistributorDto
{
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
    panNumber: string;
    allDistributor: { distributorId: ObjectId; sjbtCode: String; }[];
    category: { panCategories: ObjectId[]; itrCategories: ObjectId[]; };
    service: string[];
}

export class ChangeStatusDto
{
    requestedStatus: VerifyStatus;
}
