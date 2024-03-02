import {
  status,
  appliedFrom,
  title,
  formCategory,
} from '../entities/pan.entity';

export class CreatePanAppDto {
  category: formCategory;
  title: title;
  name: string;
  email: string;
  dob: string;
  parentName: string;
  parentType: string;
  adhaarNumber: string;
  mobileNumber: string;
  passportPhotoUrl: string;
  signaturePhotoUrl: string;
  panFormFrontPhotoUrl: string;
  panFormBackPhotoUrl: string;
  adhaarFrontPhotoUrl: string;
  adhaarBackPhotoUrl: string;
  otherDocuments: { title: string; imageUrl: string }[];
  distributorCode: string;
  appliedBy: string;
  appliedAs: string;
  txnId: string;
  payementDetails: object;
  appliedFrom: appliedFrom;
  srn: string;
  paymentCategory: string[];
  version: string;
  panNumber: string;
  acknowledgementNumber: string;
  status: status;
  assignedTo: string;
  assignedBy: string;
  comments: string;
}

export class ChangeStatusDto {
  requestedStatus: status;
}
