import {
  incomeSource,
  fillingType,
  status,
  appliedFrom,
} from '../entities/itr-application.entity';

export class CreateItrApplicationDto {
  firstName: string;
  middleName: string;
  lastName: string;
  adhaarNumber: string;
  assesmentYear: string;
  incomeSource: incomeSource;
  fillingType: fillingType;
  mobileNumber: string;
  emailId: string;
  adhaarFrontPhotoUrl: string;
  adhaarBackPhotoUrl: string;
  panCardPhotoUrl: string;
  banPassbookPhotoUrl: string;
  otherDocuments: { title: string; imageUrl: string }[];
  distributorCode: string;
  appliedBy: string;
  appliedAs: string;
  txnId: string;
  payementDetails: object;
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
