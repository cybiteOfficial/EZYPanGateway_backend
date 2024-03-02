import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import {
  DigitalPanApplication,
  DigitalPanDocument,
} from "./entities/digital-pan.entity";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import axios from "axios";
import { DigitalPanHelper } from "./digital-pan.helper";
import {
  DigitalPanWallet,
  DigitalPanWalletDocument,
} from "../digital-pan-wallet/entities/digital-pan-wallet.entity";
import {
  DigitalPanTransactions,
  DigitalPanTransactionsDocument,
  transactionType,
} from "../digital-pan-wallet-transaction/entities/digital-pan-wallet-transaction.entity";
import * as moment from "moment";

@Injectable()
export class DigitalPanCron {
  [x: string]: any;
  constructor(
    @InjectModel(DigitalPanApplication.name)
    private DigitalPanModel: Model<DigitalPanDocument>,
    @InjectModel(DigitalPanWallet.name)
    private DigitalPanWalletModel: Model<DigitalPanWalletDocument>,
    @InjectModel(DigitalPanTransactions.name)
    private DigitalPanTransactionsModel: Model<DigitalPanTransactionsDocument>,
    private DigitalPanHelper: DigitalPanHelper
  ) {}
  // @Cron('5 * * * *') // Runs every five  minute
  async handleCron() {
    const thirtyMinutesAgo = moment().subtract(30, "minutes");

    const digitalPanPendingApplication = await this.DigitalPanModel.find({
      status: "PENDING",
      createdAt: { $lt: thirtyMinutesAgo },
    });

    let agentID;
    let existingFreezeAmount = 0;
    for (let each in digitalPanPendingApplication) {
      let { txnId } = digitalPanPendingApplication[each];
      agentID = digitalPanPendingApplication[each].agentID;

      // get response from digitalpan transaction status check api
      const url = process.env.TRANSACTIONSTATUSCHECKURL;
      const Token = process.env.AUTH_TOKEN_RELIGARE;
      const PancardrefId = txnId;

      const response = await axios.post(url, {
        Token: Token,
        PancardrefId: PancardrefId,
      });

      let digitalPanWallet = await this.DigitalPanWalletModel.findOne({
        userId: agentID,
      });

      if (!DigitalPanWallet) {
        console.log("wallet not found.");
      }
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      let walletAmt = digitalPanWallet.walletAmount;
      existingFreezeAmount = digitalPanWallet.freezeAmount;
      let paymentStatusToUpdate;
      let txnAmount;

      if (response["data"]["TxnId"] !== null) {
        txnAmount = response["data"]["Transactions"]["Amount"];
        paymentStatusToUpdate = response["data"]["Transactions"]["Status"];
      }

      //deduct amount and create wallet history if status is success
      if (response["data"]["StatusCode"] == 1) {
        let deductAmount = await this.DigitalPanWalletModel.findOneAndUpdate(
          { userId: agentID },
          {
            $set: {
              walletAmount: walletAmt - txnAmount,
              freezeAmount: existingFreezeAmount - txnAmount,
            },
          }
        );

        const DigitalwalletTransactionToBeCreate = {
          walletId: digitalPanWallet._id,
          userId: agentID,
          uniqueTransactionId: "",
          remark: `Wallet amount deducted  ${txnAmount}  for Digital Pan application.`,
          serialNumber: "",
          transactionType: transactionType.DEBIT,
          txnId: txnId,
          paymentStatus: paymentStatusToUpdate,
          debitedAmount: txnAmount,
          createdByType: "",
          createdById: "",
          dateAndTime: currentDate,
        };

        const digitalPanWalletHistory =
          await this.DigitalPanTransactionsModel.create({
            ...DigitalwalletTransactionToBeCreate,
          });

        if (!digitalPanWalletHistory) {
          console.log("Digital pan wallet transaction history not created");
        }
      }

      //deduct freezed amount if status is failed
      if (
        response["data"]["StatusCode"] == 0 &&
        response["data"]["TxnId"] !== null
      ) {
        let deductAmount = await this.DigitalPanWalletModel.findOneAndUpdate(
          { userId: agentID },
          {
            $set: {
              freezeAmount: existingFreezeAmount - txnAmount,
            },
          }
        );
      }

      let userDetails = await this.DigitalPanHelper.getAppliedUser(agentID);

      //update DigitalPanApplication
      if (response["data"]["TxnId"] !== null) {
        let updateDigitalPanApplication =
          await this.DigitalPanModel.findOneAndUpdate(
            {
              txnId: txnId,
            },
            {
              $set: {
                totalPrice: response["data"]["Transactions"].Amount,
                Type: response["data"]["Transactions"].Type,
                mobileNumber: response["data"]["Transactions"].Number,
                status: response["data"]["Transactions"].Status.toUpperCase(),
                Transactions: response["data"]["Transactions"],
                appliedByType: userDetails.userType,
                appliedByNumber: userDetails.mobileNumber,
                appliedById: agentID,
                appliedByName: userDetails.name,
              },
            }
          );
      }

      console.log("Cron job is running...");
    }
  }
}
