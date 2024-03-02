import { status } from "../api/panapplications/entities/pan.entity";
import { VerifyStatus } from "../api/user/entities/user.entity";
import { HttpException, HttpStatus } from "@nestjs/common";
import { RequestStatus } from "../api/refund-request/entities/refund-request.entity";

//change status function for application
export function changestatusForApp(
  currentstatus: status,
  requestedStatus: status
): status {
  switch (currentstatus) {
    case status.BLANK:
      if (requestedStatus === status.PENDING) {
        return status.PENDING;
      }
      break;

    case status.PENDING:
      if (requestedStatus === status.IN_PROGRESS) {
        return status.IN_PROGRESS;
      }
      break;

    case status.IN_PROGRESS:
      if (
        requestedStatus === status.REJECT ||
        requestedStatus === status.VERIFY
      ) {
        return requestedStatus;
      }
      break;

    case status.VERIFY:
      if (requestedStatus === status.GENERATE) {
        return status.GENERATE;
      }
      break;

    case status.GENERATE:
      if (requestedStatus === status.DONE) {
        return status.DONE;
      }
      break;

    case status.REJECT:
      if (
        requestedStatus === status.PENDING ||
        requestedStatus === status.CANCELLED
      ) {
        return requestedStatus;
      }
      break;
  }

  throw new HttpException(
    `Cannot change status from ${currentstatus.replace(
      /_/g,
      " "
    )} to ${requestedStatus.replace(/_/g, " ")}`,
    HttpStatus.OK
  );
}

//change status for user
export function changestatusForUser(
  currentstatus: VerifyStatus,
  requestedStatus: VerifyStatus
): VerifyStatus {
  switch (currentstatus) {
    case VerifyStatus.PENDING:
      if (
        requestedStatus === VerifyStatus.REJECTED ||
        requestedStatus === VerifyStatus.VERIFIED
      ) {
        return requestedStatus;
      }
      break;

    case VerifyStatus.REJECTED:
      if (requestedStatus === VerifyStatus.PENDING) {
        return VerifyStatus.PENDING;
      }
      if (requestedStatus === VerifyStatus.VERIFIED) {
        return VerifyStatus.VERIFIED;
      }

      break;
  }

  throw new HttpException(
    `Cannot change status from ${currentstatus} to ${requestedStatus}`,
    HttpStatus.OK
  );
}

//get all counts of application with their status
export async function getApplicationCounts(collection): Promise<{
  PENDING: number;
  IN_PROGRESS: number;
  VERIFY: number;
  REJECT: number;
  GENERATE: number;
  DONE: number;
  CANCELLED: number;
}> {
  const [PENDING, IN_PROGRESS, VERIFY, REJECT, GENERATE, DONE, CANCELLED] =
    await Promise.all([
      collection.find({ status: status.PENDING, isDeleted: false }).count(),
      collection.find({ status: status.IN_PROGRESS, isDeleted: false }).count(),
      collection.find({ status: status.VERIFY, isDeleted: false }).count(),
      collection.find({ status: status.REJECT, isDeleted: false }).count(),
      collection.find({ status: status.GENERATE, isDeleted: false }).count(),
      collection.find({ status: status.DONE, isDeleted: false }).count(),
      collection.find({ status: status.CANCELLED, isDeleted: false }).count(),
    ]);
  return { PENDING, IN_PROGRESS, VERIFY, REJECT, GENERATE, DONE, CANCELLED };
}

//validate status with requests file or reason for application
export async function validateRequest(req) {
  const { requestedStatus, rejectionReason, remark, file } = req;

  if (requestedStatus === status.VERIFY && !file) {
    throw new HttpException(`PDF file is required.`, HttpStatus.OK);
  }

  if (requestedStatus === status.REJECT && !rejectionReason) {
    throw new HttpException(`Rejection reason is required.`, HttpStatus.OK);
  }

  if (requestedStatus === status.REJECT && file) {
    throw new HttpException(
      `PDF file is not allowed for status ${status.REJECT}.`,
      HttpStatus.OK
    );
  }

  if (requestedStatus === status.VERIFY && rejectionReason) {
    throw new HttpException(
      `Rejection reason is not allowed for status ${status.VERIFY}.`,
      HttpStatus.OK
    );
  }
}

//destructure user model filed for add in flow table
export async function extractFieldsForUserFlowTable(obj) {
  const {
    name,
    email,
    mobileNumber,
    dob,
    fatherName,
    firmName,
    address,
    area,
    cityVillageName,
    district,
    pincode,
    state,
    adhaarCardImage,
    panCardImage,
    cancelChequeImage,
    declarationFormPhotoUrl,
    password,
    sjbtCode,
    rejectionReason,
    userType,
    status,
    panNumber,
    role,
    isProfileComplete,
    isDeleted,
    isActive,
    isVerified,
    isBlocked,
    emailVerified,
    isAppliedForDistributor,
    mobileNumberVerified,
    allDistributor,
    category,
    services,
    logs,
  } = obj;

  return {
    name,
    email,
    mobileNumber,
    dob,
    fatherName,
    firmName,
    address,
    area,
    cityVillageName,
    district,
    pincode,
    state,
    adhaarCardImage,
    panCardImage,
    cancelChequeImage,
    declarationFormPhotoUrl,
    password,
    sjbtCode,
    rejectionReason,
    userType,
    status,
    panNumber,
    role,
    isProfileComplete,
    isDeleted,
    isActive,
    isVerified,
    isBlocked,
    emailVerified,
    isAppliedForDistributor,
    mobileNumberVerified,
    allDistributor,
    category,
    services,
    logs,
  };
}

//change status function for refund request
export function changeRefundRequestStatus(
  currentstatus: RequestStatus,
  requestedStatus: RequestStatus
): RequestStatus {
  switch (currentstatus) {
    case RequestStatus.PENDING:
      if (
        requestedStatus === RequestStatus.REJECT ||
        requestedStatus === RequestStatus.COMPLETE
      ) {
        return requestedStatus;
      }
      break;
  }

  throw new HttpException(
    `Cannot change status from ${currentstatus.replace(
      /_/g,
      " "
    )} to ${requestedStatus.replace(/_/g, " ")}`,
    HttpStatus.OK
  );
}
