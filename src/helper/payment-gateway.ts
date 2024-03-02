import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "../api/user/entities/user.entity";
import { PaytmChecksum } from "./paytmChecksum";
// import Paytm from 'paytm-pg-node-sdk';
import { keyValidationCheck } from "../helper/keysValidationCheck";
import { paymentStatus } from "../api/transaction/entities/transaction.entity";
import { TransactionService } from "../api/transaction/transaction.service";
import * as moment from "moment";
import { errorRes } from "./errorRes";
import { AddLogFunction } from "./addLog";
import { HttpException, HttpStatus } from "@nestjs/common";
import * as https from "https";
import {
  Transaction,
  TransactionDocument,
  paytmStatus,
} from "../api/transaction/entities/transaction.entity";
export class paytmFunctions {
  @InjectModel(User.name) private userModel: Model<UserDocument>;
  private readonly TransactionService: TransactionService;
  private readonly addLogFunction: AddLogFunction;

  async getPaytmCredentials() {
    const mId =
      process.env.ENV === "PROD"
        ? process.env.PAYTM_MID_PROD
        : process.env.PAYTM_MID_DEV;
    const mKey =
      process.env.ENV === "PROD"
        ? process.env.PAYTM_MERCHANT_KEY_PROD
        : process.env.PAYTM_MERCHANT_KEY_DEV;
    const websiteName =
      process.env.ENV === "PROD"
        ? process.env.PAYTM_WEBSITE_PROD
        : process.env.PAYTM_WEBSITE_DEV;
    const callbackUrl =
      process.env.ENV === "PROD"
        ? process.env.PAYTM_CALLBACK_URL_PROD
        : process.env.PAYTM_CALLBACK_URL_DEV;
    const hostname =
      process.env.ENV === "PROD"
        ? process.env.PAYTM_HOST_NAME_PROD
        : process.env.PAYTM_HOST_NAME_DEV;

    const port = process.env.PAYTM_PORT;
    return {
      mId,
      mKey,
      websiteName,
      callbackUrl,
      hostname,
      port,
    };
  }

  async initiatePayment(applicationData: any) {
    try {
      /*
       * import checksum generation utility
       * You can get this utility from https://developer.paytm.com/docs/checksum/
       */

      const {
        userId,
        totalAmount,
        email,
        uniqueTransactionId,
        mobileNumber,
        appliedFrom,
      } = applicationData;

      const { mId, mKey, websiteName, callbackUrl, hostname, port } =
        await this.getPaytmCredentials();

      const paytmParams = {};
      const amountDetail = {
        value: totalAmount,
        // value: "100.00",
        currency: "INR",
      };
      paytmParams["body"] = {
        requestType: "Payment",
        mid: mId,
        websiteName: websiteName,
        orderId: uniqueTransactionId,
        callbackUrl:
          appliedFrom === "APP"
            ? `https://securegw.paytm.in/theia/paytmCallback?ORDER_ID=${uniqueTransactionId}`
            : callbackUrl,
        txnAmount: {
          ...amountDetail,
        },
        userInfo: {
          custId: userId,
        },
      };
      console.log(paytmParams["body"]["callbackUrl"]);
      const bodyToPass = JSON.stringify(paytmParams["body"]);

      /*
       * Generate checksum by parameters we have in body
       * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys
       */
      const paymentGatewayRes: any = await new Promise(async function (
        resolve,
        reject
      ) {
        const checksum = await PaytmChecksum.generateSignature(
          bodyToPass,
          mKey
        );
        if (!checksum) {
          resolve({
            status: false,
            message: "checksum not created",
            data: {
              reqData: paytmParams,
              resData: null,
            },
          });
        }

        paytmParams["head"] = {
          signature: checksum,
        };
        const post_data = JSON.stringify(paytmParams);
        const options = {
          hostname: hostname,
          port: port,
          path: `/theia/api/v1/initiateTransaction?mid=${mId}&orderId=${uniqueTransactionId}`,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": post_data.length,
          },
        };

        let response = "";
        const result = await new Promise(async function (resolve, reject) {
          const post_req = await https.request(options, function (post_res) {
            post_res.on("data", function (chunk) {
              response += chunk;
            });

            post_res.on("end", function () {
              let resData = JSON.parse(JSON.stringify(response));
              resData = JSON.parse(resData);
              const resBody = resData.body.resultInfo;

              if (
                resBody.resultCode === "0000" &&
                resBody.resultMsg === "Success" &&
                resBody.resultStatus === "S"
              ) {
                resolve({
                  status: true,
                  message: `Hash generated ${resBody.resultMsg}`,
                  data: {
                    reqData: paytmParams,
                    resData: {
                      ...resData,
                      orderId: uniqueTransactionId,
                      mid: mId,
                      txnToken: resData.body.txnToken,
                      signature: resData.head.signature,
                      txnAmount: amountDetail,
                    },
                  },
                });
              } else {
                resolve({
                  status: false,
                  message: resBody.resultMsg,
                  data: {
                    reqData: paytmParams,
                    resData: {
                      ...resData,
                      orderId: uniqueTransactionId,
                      mid: mId,
                      txnToken: null,
                      signature: null,
                      amountDetail,
                    },
                  },
                });
              }
            });
          });
          post_req.write(post_data);
          post_req.end();
        });
        resolve(result);
      });

      if (!paymentGatewayRes["status"] || !paymentGatewayRes["data"]) {
        return {
          status: false,
          message: paymentGatewayRes.message,
          data: null,
        };
      } else {
        const { reqData, resData } = paymentGatewayRes["data"];
        /**
         * update transaction reqData: [ { ...reqData } ],
          resData: [ { ...resData } ],
         */
        return {
          status: true,
          message: "Redirect to Payment Gateway",
          data: {
            orderId: resData.orderId,
            txnToken: resData.txnToken,
            txnAmount: resData.txnAmount,
            txnStatus: paymentStatus.PENDING,
            reqData: [{ ...reqData }],
            resData: [{ ...resData }],
          },
        };
      }
    } catch (err) {
      let i = 1;
      let error_msg = "";
      const statusCode =
        err.status !== undefined && err.status !== null ? err.status : 500;
      if (!err.message) {
        for (const key in err.errors) {
          if (err.errors[key].message) {
            error_msg += i + "." + err.errors[key].message;
            i++;
          }
        }
      } else {
        error_msg = err.message;
      }
      return {
        status: false,
        message: error_msg,
        data: {
          reqData: null,
          resData: null,
        },
      };
    }
  }

  async verifyPayment(reqBody, txnData) {
    try {
      const {
        MID: mid,
        ORDERID: orderId,
        STATUS: status,
        TXNAMOUNT: txnAmount,
        TXNID: txnId,
      } = reqBody;

      const {
        userId,
        userType,
        sjbtCode,
        transactionFor,
        paymentStatus: existingStatus,
        totalAmount,
      } = txnData;

      const { mId, mKey, websiteName, callbackUrl, hostname, port } =
        await this.getPaytmCredentials();

      const paytmParams = {};
      const amountDetail = {
        value: txnAmount.toString(),
        currency: "INR",
      };
      paytmParams["body"] = {
        requestType: "Payment",
        mid: mId,
        websiteName: websiteName,
        orderId: orderId,
        callbackUrl: callbackUrl,
        txnAmount: {
          ...amountDetail,
        },
        userInfo: {
          custId: userId,
        },
      };

      const bodyToPass = JSON.stringify(paytmParams["body"]);

      /*
       * Generate checksum by parameters we have in body
       * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys
       *
       */

      const newChecksum = await PaytmChecksum.generateSignature(
        bodyToPass,
        mKey
      );

      if (!newChecksum) {
        return {
          message: `Payment under process.`,
          status: true,
          data: process.env.TXN_PENDING_REDIRECT_URL,
          paymentStatus: "PENDING",
        };
      }

      paytmParams["head"] = {
        signature: newChecksum,
      };
      const post_data = JSON.stringify(paytmParams);
      const options = {
        hostname: hostname,
        port: port,
        path: "/v3/order/status",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": post_data.length,
        },
      };

      let response = "";

      return await new Promise(async function (resolve, reject) {
        const verifyresult = await https.request(options, function (post_res) {
          post_res.on("data", function (chunk) {
            response += chunk;
          });

          post_res.on("end", function () {
            let resData = JSON.parse(JSON.stringify(response));
            resData = JSON.parse(resData);
            const resBody = resData.body.resultInfo;

            if (
              resBody.resultCode === "01" ||
              // resBody.resultMsg.toUpperCase() === paymentStatus.SUCCESS &&
              resBody.resultStatus === paytmStatus.TXN_STATUS_SUCCESS
            ) {
              resolve({
                status: true,
                message: resBody.resultMsg,
                data: process.env.TXN_SUCCESS_REDIRECT_URL,
                paymentStatus: paymentStatus.SUCCESS,
              });
            } else if (
              resBody.resultCode === "400" ||
              resBody.resultStatus === paytmStatus.TXN_STATUS_PENDING ||
              resBody.resultCode === "402"
            ) {
              resolve({
                status: true,
                message: resBody.resultMsg,
                data: process.env.TXN_PENDING_REDIRECT_URL,
                paymentStatus: paymentStatus.PENDING,
              });
            } else {
              resolve({
                status: true,
                message: resBody.resultMsg,
                data: process.env.TXN_FAILURE_REDIRECT_URL,
                paymentStatus: paymentStatus.FAILURE,
              });
            }
          });
        });

        verifyresult.write(post_data);
        verifyresult.end();
      });
    } catch (err) {
      let i = 1;
      let error_msg = "";
      const statusCode =
        err.status !== undefined && err.status !== null ? err.status : 500;
      if (!err.message) {
        for (const key in err.errors) {
          if (err.errors[key].message) {
            error_msg += i + "." + err.errors[key].message;
            i++;
          }
        }
      } else {
        error_msg = err.message;
      }
      return {
        status: false,
        message: error_msg,
        data: {
          reqData: null,
          resData: null,
        },
      };
    }
  }
  async verifyTxnStatus(txnData) {
    try {
      // const {
      //   MID: mid,
      //   ORDERID: orderId,
      //   STATUS: status,
      //   TXNAMOUNT: txnAmount,
      //   TXNID: txnId,
      // } = txnDataresData;
      let orderId = txnData.resData[0].orderId;
      let txnAmount = txnData.resData[0].txnAmount.value;
      const {
        userId,
        userType,
        sjbtCode,
        transactionFor,
        paymentStatus: existingStatus,
        totalAmount,
      } = txnData;

      const { mId, mKey, websiteName, callbackUrl, hostname, port } =
        await this.getPaytmCredentials();

      const paytmParams = {};
      const amountDetail = {
        value: txnAmount.toString(),
        currency: "INR",
      };
      paytmParams["body"] = {
        requestType: "Payment",
        mid: mId,
        websiteName: websiteName,
        orderId: orderId,
        callbackUrl: callbackUrl,
        txnAmount: {
          ...amountDetail,
        },
        userInfo: {
          custId: userId,
        },
      };

      const bodyToPass = JSON.stringify(paytmParams["body"]);

      /*
       * Generate checksum by parameters we have in body
       * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys
       *
       */

      const newChecksum = await PaytmChecksum.generateSignature(
        bodyToPass,
        mKey
      );

      if (!newChecksum) {
        return {
          message: `Payment under process.`,
          status: true,
          data: process.env.TXN_PENDING_REDIRECT_URL,
          paymentStatus: "PENDING",
        };
      }

      paytmParams["head"] = {
        signature: newChecksum,
      };
      const post_data = JSON.stringify(paytmParams);
      const options = {
        hostname: hostname,
        port: port,
        path: "/v3/order/status",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": post_data.length,
        },
      };

      let response = "";

      return await new Promise(async function (resolve, reject) {
        const verifyresult = await https.request(options, function (post_res) {
          post_res.on("data", function (chunk) {
            response += chunk;
          });

          post_res.on("end", function () {
            let resData = JSON.parse(JSON.stringify(response));
            resData = JSON.parse(resData);
            const resBody = resData.body.resultInfo;

            if (
              resBody.resultCode === "01" ||
              // resBody.resultMsg.toUpperCase() === paymentStatus.SUCCESS &&
              resBody.resultStatus === paytmStatus.TXN_STATUS_SUCCESS
            ) {
              resolve({
                status: true,
                message: resBody.resultMsg,
                data: process.env.TXN_SUCCESS_REDIRECT_URL,
                paymentStatus: paymentStatus.SUCCESS,
              });
            } else if (
              resBody.resultCode === "400" ||
              resBody.resultStatus === paytmStatus.TXN_STATUS_PENDING ||
              resBody.resultCode === "402"
            ) {
              resolve({
                status: true,
                message: resBody.resultMsg,
                data: process.env.TXN_PENDING_REDIRECT_URL,
                paymentStatus: paymentStatus.PENDING,
              });
            } else {
              resolve({
                status: true,
                message: resBody.resultMsg,
                data: process.env.TXN_FAILURE_REDIRECT_URL,
                paymentStatus: paymentStatus.FAILURE,
              });
            }
          });
        });

        verifyresult.write(post_data);
        verifyresult.end();
      });
    } catch (err) {
      let i = 1;
      let error_msg = "";
      const statusCode =
        err.status !== undefined && err.status !== null ? err.status : 500;
      if (!err.message) {
        for (const key in err.errors) {
          if (err.errors[key].message) {
            error_msg += i + "." + err.errors[key].message;
            i++;
          }
        }
      } else {
        error_msg = err.message;
      }
      return {
        status: false,
        message: error_msg,
        data: {
          reqData: null,
          resData: null,
        },
      };
    }
  }
}
