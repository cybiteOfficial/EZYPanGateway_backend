import * as moment from "moment";

/**check userName is valid or not*/
export function isUserNameValid(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_\-!@#$%^&*()+=~`{}[\]|\\:;"'<>,.?/]+$/;
  return usernameRegex.test(username);
}

/**check email is valid or not*/
export function isEmailValid(email: string): boolean {
  const emailRegex = /^\b[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b$/i;
  return emailRegex.test(email);
}

/**check mobile number is valid or not*/
export function isMobileValid(mobileNumber: string): boolean {
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobileNumber);
}

/**check adhar number is valid or not*/
export function isAadharValid(adhaarNumber: string): boolean {
  const trimmedAadhaarNumber = adhaarNumber.trim();
  if (trimmedAadhaarNumber.length !== 12) {
    return false;
  }
  return true;
}

/**check dob is valid or not*/
export function isValidDate(dob: string): boolean {
  const date = moment(dob, "YYYY-MM-DD", true).isValid();
  return date;
}

/**check PAN number is valid or not*/
export function isPanValid(panNumber: string): boolean {
  const panRegex = /([A-Z]){5}([0-9]){4}([A-Z]){1}$/;
  return panRegex.test(panNumber);
}

/**check minor or not */
export function isMinor(dob: string): boolean {
  const dateOfBirth = moment(dob, "YYYY-MM-DD");
  const age = moment().utcOffset("+05:30").diff(dateOfBirth, "years");
  return age < 18;
}

/**check account no. of 9 to 18 digit long */
export function isAccountNumberValid(num) {
  const regex = /^\d{9,18}$/; // 9 to 18 digits regex pattern
  return regex.test(num);
}

/**check indian IFSC code */
export function isValidIFSC(ifsc) {
  const regex = /^[A-Z]{4}0[A-Z0-9]{6}$/; // IFSC code regex pattern
  return regex.test(ifsc);
}

export function isValidPassword(password) {
  let resTosend = { status: true, Msg: "" };

  if (password.length < 8) {
    resTosend = {
      status: false,
      Msg: "Password must be at least 8 characters long.",
    };
  }
  return resTosend;
}

export const isvalidUrl = (isUrl) => {
  const regEx =
    /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
  if (!isUrl.match(regEx)) {
    return false;
  } else {
    return true;
  }
};

export const generateRandomPassword = () => {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";

  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset.charAt(randomIndex);
  }
  return password;
};
