/* eslint-disable @typescript-eslint/no-empty-function */
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import * as moment from "moment";
import { Model } from "mongoose";
import {
  Transaction,
  TransactionDocument,
} from "../api/transaction/entities/transaction.entity";
import axios from "axios";

@Injectable()
export class getUniqueTransactionId {
  [x: string]: any;
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>
  ) {}

  async generateId() {
    const maxGrpIdData = await this.transactionModel
      .find()
      .sort({ serialNumber: -1 })
      .limit(1);

    let serialNumber = 1;
    const randomNum = Math.floor(100 + Math.random() * 900);
    if (
      maxGrpIdData.length !== 0 &&
      maxGrpIdData[0].serialNumber !== null &&
      maxGrpIdData[0].serialNumber !== undefined
    ) {
      serialNumber = maxGrpIdData[0].serialNumber + 1;
    }
    const currentDate = moment().utcOffset("+05:30").format("MMDDHHmmssYY");
    const uniqueTransactionId = `SJBT${serialNumber}-`.concat(
      currentDate + randomNum
    ); // format===> groupid +##+ mm-dd-hh-mm-ss-yy

    const dataToSend = {
      uniqueTransactionId: uniqueTransactionId,
      serialNumber: serialNumber,
    };

    return dataToSend;
  }

  async paymentVerify(uniqueTransactionId) {
    try {
      let resToSend = { status: false, data: null };
      let getTxnDetails = await this.transactionModel.findOne({
        uniqueTransactionId: uniqueTransactionId,
      });
      if (!getTxnDetails) {
        return { status: false, data: null };
      }
      const signature = getTxnDetails.reqData[0]["head"]["signature"];
      const url = "https://securegw.paytm.in/v3/order/status";
      const requestBody = {
        body: {
          mid: process.env.PAYTM_MID_PROD,
          orderId: uniqueTransactionId,
        },
        head: {
          signature: signature,
        },
      };
      const headers = {
        "Content-Type": "application/json",
      };

      const response = await axios.post(url, requestBody, { headers });

      resToSend.status = true;
      resToSend.data = response.data;
      return resToSend.data;
    } catch (error) {
      return { status: false, data: null };
    }
  }
}
