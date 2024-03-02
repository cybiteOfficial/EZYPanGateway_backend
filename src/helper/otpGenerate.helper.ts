import * as moment from "moment";
import * as crypto from "crypto";

export function generateSRN(services) {
  const randomNum = Math.floor(Math.random() * 900) + 100;
  const timestamp = moment().utcOffset("+05:30").format("YYYYMMDDHHmmss");
  const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
  const referenceNum = `${services}${timestamp}${randomNum}`;

  return referenceNum;
}
export function generateOTP(req) {
  const digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let emailOTP = null;
  let mobileOTP = null;

  const email = req.body?.email || req.otpData?.userEmail;
  const mobileNumber = req.body?.mobileNumber || req.otpData?.contactNumber;

  // Generate random OTP string(s) based on request body or user data
  if (email) {
    let otp = "";
    for (let i = 0; i < 6; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    emailOTP = otp;
  }
  if (mobileNumber) {
    let otp = "";
    for (let i = 0; i < 6; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    mobileOTP = otp;
  }

  const OTP = { emailOTP, mobileOTP };

  return OTP;
}

export function generateEmailMobileOTP(req) {
  const digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let emailOTP = null;
  let mobileOTP = null;
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  emailOTP = otp;
  mobileOTP = otp;

  const OTP = { emailOTP, mobileOTP };

  return OTP;
}
