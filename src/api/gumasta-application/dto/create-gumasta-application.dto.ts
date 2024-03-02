import { status, appliedFrom } from '../entities/gumasta-application.entity';

export class CreateGumastaApplicationDto {
  propritorName: string;
  adhaarNumber: string;
  mobileNumber: string;
  email: string;
  adhaarPhotoUrl: string;
  firmName: string;
  firmAddress: string;
  propritorPhotoUrl: string;
  shopOfficePhotoUrl: string;
  addressProofPhotoUrl: string;
  otherDocuments: { title: string; imageUrl: string }[];
  state: string;
  district: string;
  distributorCode: string;
  appliedBy: string;
  appliedAs: string;
  txnId: string;
  payementDetails: string;
  srn: string;
  appliedFrom: appliedFrom;
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
