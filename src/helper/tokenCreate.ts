/* eslint-disable prettier/prettier */
import * as jwt from "jsonwebtoken";
import * as moment from "moment";

//---------create access token and refresh token---------//
export async function createToken(
  user: any,
  userType: string,
  sjbtCode: string
) {
  const accessToken = jwt.sign(
    {
      Id: user._id,
      userName: user.name,
      userEmail: user.email,
      contactNumber: user.mobileNumber,
      token_type: "LOGIN",
      type: userType,
      sjbtCode: sjbtCode,
    },
    process.env.SEC_KEY_ACC,
    {
      expiresIn: "1y",
    }
  );
  const refreshToken = jwt.sign(
    {
      Id: user._id,
      userName: user.name,
      userEmail: user.email,
      contactNumber: user.mobileNumber,
      token_type: "REFRESH",
      type: userType,
      sjbtCode: sjbtCode,
    },
    process.env.SEC_KEY_REF,
    {
      expiresIn: "1y",
    }
  );

  const token = { accessToken: accessToken, refreshToken: refreshToken };

  return token;
}

//---------create access token and refresh token---------//
export async function createTokenAdmin(user: any) {
  const accessToken = jwt.sign(
    {
      Id: user._id,
      userName: user.userName,
      userEmail: user.email,
      contactNumber: user.mobile,
      token_type: "LOGIN",
      type: user.role,
      roleName: user.adminRoleGroupName,
    },
    process.env.SEC_KEY_ACC,
    {
      expiresIn: "1d",
    }
  );
  const refreshToken = jwt.sign(
    {
      Id: user._id,
      userName: user.name,
      userEmail: user.email,
      contactNumber: user.mobileNumber,
      token_type: "REFRESH",
      type: user.userType,
    },
    process.env.SEC_KEY_REF,
    {
      expiresIn: "1y",
    }
  );

  const token = { accessToken: accessToken, refreshToken: refreshToken };

  return token;
}

//-----------create token for otp------------//
export async function otpToken(
  user: any,
  req: any,
  userType: string,
  sjbtCode
) {
  let emailOTPToken = null;
  let mobileOTPToken = null;

  const email = req.body?.email || user.email;
  const mobileNumber = req.body?.mobileNumber || user.mobileNumber;

  if (email) {
    emailOTPToken = jwt.sign(
      {
        Id: user._id,
        userName: user.name,
        userEmail: email,
        contactNumber: mobileNumber,
        token_type: "EMAIL_OTP",
        type: userType,
        sjbtCode: sjbtCode,
      },
      process.env.SEC_KEY_ACC,
      {
        expiresIn: "10m",
      }
    );
  }
  if (mobileNumber) {
    mobileOTPToken = jwt.sign(
      {
        Id: user._id,
        userName: user.name,
        userEmail: email,
        contactNumber: mobileNumber,
        token_type: "MOBILE_OTP",
        type: userType,
        sjbtCode: sjbtCode,
      },
      process.env.SEC_KEY_ACC,
      {
        expiresIn: "10m",
      }
    );
  }

  const otpToken = { emailOTPToken, mobileOTPToken };
  return otpToken;
}
