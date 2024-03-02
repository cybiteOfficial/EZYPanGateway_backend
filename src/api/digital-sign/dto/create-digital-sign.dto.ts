import { appliedFrom, status } from '../entities/digital-sign.entity';

export class CreateDigitalSignDto {
  propritorName: string;
  srn: string;
  email: string;
  mobileNumber: string;
  adhaarNumber: string;
  address: string;
  photoUrl: string;
  adhaarCardPhotoUrl: string;
  panCardPhotoUrl: string;
  otherDocuments: { title: string; imageUrl: string }[];
  appliedBy: string;
  appliedAs: string;
  txnId: string;
  payementDetails: object;
  appliedFrom: appliedFrom;
  version: string;
  panNumber: string;
  status: status;
  assignedTo: string;
  assignedBy: string;
  comments: string;
}

export class ChangeStatusDto {
  requestedStatus: status;
}
