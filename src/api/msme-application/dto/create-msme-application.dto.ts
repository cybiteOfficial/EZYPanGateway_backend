import { status, appliedFrom } from '../entities/msme-application.entity';

export class CreateMsmeApplicationDto {
  propritorName: string;
  adhaarNumber: string;
  firmName: string;
  address: string;
  srn: string;
  email: string;
  mobileNumber: string;
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
