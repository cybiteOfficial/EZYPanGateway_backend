import { Injectable } from "@nestjs/common";
import {
  Transaction,
  TransactionDocument,
  paymentStatus,
  paytmStatus,
  transactionFor,
} from "./entities/transaction.entity";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { PaytmChecksum } from "../../helper/paytmChecksum";
import { keyValidationCheck } from "../../helper/keysValidationCheck";
import * as moment from "moment";
import { errorRes } from "../../helper/errorRes";
import { AddLogFunction } from "../../helper/addLog";
import { HttpException, HttpStatus } from "@nestjs/common";
import * as https from "https";
import {
  subscriptionPayment,
  User,
  UserDocument,
} from "../user/entities/user.entity";
import { TransactionHelper } from "./transaction.helper";
import { paytmFunctions } from "../../helper/payment-gateway";
import { Admin, adminDocument } from "../admin/entities/admin.entity";
import {
  DigitalPanTransactions,
  DigitalPanTransactionsDocument,
  transactionType,
} from "../digital-pan-wallet-transaction/entities/digital-pan-wallet-transaction.entity";
import {
  DigitalPanApplication,
  DigitalPanDocument,
} from "../../api/digital-pan/entities/digital-pan.entity";
import {
  DigitalPanWallet,
  DigitalPanWalletDocument,
} from "../digital-pan-wallet/entities/digital-pan-wallet.entity";
import { status } from "../digital-sign/entities/digital-sign.entity";
import { getUniqueTransactionId } from "../../helper/paymentGatewayHelper";
import { serviceType } from "../price-config/entities/price-config.entity";
import { EmailService } from "../../helper/sendEmail";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class TransactionCronService {
  [x: string]: any;
  constructor(
    @InjectModel(DigitalPanApplication.name)
    private readonly DigitalPanApplicationModel: Model<DigitalPanDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(DigitalPanWallet.name)
    private readonly DigitalPanWalletModel: Model<DigitalPanWalletDocument>,
    @InjectModel(DigitalPanTransactions.name)
    private readonly DigitalPanTransactionsModel: Model<DigitalPanTransactionsDocument>,
    @InjectModel(Admin.name)
    private readonly adminModel: Model<adminDocument>,
    private readonly addLogFunction: AddLogFunction,
    private readonly TransactionHelper: TransactionHelper,
    private readonly paytmFunctions: paytmFunctions,
    private readonly getUniqueTransactionId: getUniqueTransactionId,
    private readonly EmailService: EmailService
  ) {}

  //-------------------------------------------------------------------------
  /***
   * verify signature
   */
  //-------------------------------------------------------------------------
  // @Cron("*/5 * * * *") // Runs every five  minute
  @Cron("*/30 * * * *")
  async PendingPayment(req, res) {
    try {
      console.log("cronjob is running...");
      const currentDate = moment().utcOffset("+05:30").format("YYYY-MM-DD ");
      const thirtyMinutesAgo = moment().subtract(30, "minutes");
      const txnData = await this.transactionModel
        .find({
          paymentStatus: status.PENDING,
          createdAt: { $lt: thirtyMinutesAgo.toDate() },
        })
        .sort({ createdAt: -1 });

      if (!txnData.length) {
        console.log("Transaction not found");
      }

      for (const transaction of txnData) {
        let orderId = transaction.uniqueTransactionId;

        /**
         *
         * verify payment function to check transaction status use api  payment gateway
         *
         */
        const isPaymentVerified: any =
          await this.paytmFunctions.verifyTxnStatus(transaction);

        if (!isPaymentVerified.status) {
          throw new HttpException(isPaymentVerified.message, HttpStatus.OK);
        }

        /**
         *
         * txnDataToBeUpdated :to update transaction status and transaction Id received from pament gateway
         *
         */
        const txnDataToBeUpdated = {
          $set: {
            paymentStatus: isPaymentVerified.paymentStatus,
          },
        };

        /**
         *
         * appOrUserDataToBeUpdate :to update transaction status and transaction Id received from payment gateway into
         * application or user in case of subscription
         *
         */

        let appOrUserDataToBeUpdate;

        if (transaction.transactionFor === transactionFor.SERVICE_PAYMENT) {
          appOrUserDataToBeUpdate = {
            $set: { txnStatus: isPaymentVerified.paymentStatus },
          };
        }

        if (transaction.transactionFor === transactionFor.SUBSCRIPTION_PLAN) {
          appOrUserDataToBeUpdate = {
            $set: {
              subscriptionTxnStatus: isPaymentVerified.paymentStatus,
              subscriptionTxnDate: currentDate,
              subscriptionPayment:
                isPaymentVerified.paymentStatus === paymentStatus.SUCCESS
                  ? subscriptionPayment.SUCCESS
                  : subscriptionPayment.PENDING,
            },
          };
        }

        /**
         * update digital pan wallet in case of recharge wallet payment declined and failure
         */

        if (
          isPaymentVerified.paymentStatus === paymentStatus.SUCCESS &&
          transaction.transactionFor ===
            transactionFor.DIGITAL_PAN_WALLET_RECHARGE
        ) {
          const updateDigitalPanWallet =
            await this.TransactionHelper.updateDigitalPanWallet(
              req,
              orderId,
              isPaymentVerified.paymentStatus
            );

          if (!updateDigitalPanWallet.status) {
            console.log(updateDigitalPanWallet.msg);
          }
        }

        if (
          isPaymentVerified.paymentStatus === paymentStatus.FAILURE &&
          transaction.transactionFor ===
            transactionFor.DIGITAL_PAN_WALLET_RECHARGE
        ) {
          const updateDigitalPanWallet =
            await this.TransactionHelper.createDigitalPanWalletHistory(
              req,
              orderId,
              isPaymentVerified.paymentStatus
            );

          if (!updateDigitalPanWallet.status) {
            console.log(updateDigitalPanWallet.msg);
          }
        }

        const transactionUpdate = await this.TransactionHelper.updateTxnStatus(
          "YES",
          isPaymentVerified.paymentStatus,
          orderId,
          txnDataToBeUpdated,
          appOrUserDataToBeUpdate,
          req,
          res
        );

        if (!transactionUpdate.status) {
          console.log(transactionUpdate.msg);
        }

        /**find application */
        let applicationFound;
        let refundAmount;
        let rewardAmount;
        for (const applicationDetails of transaction.applicationDetails) {
          const { applicationType, applicationId, srn } = applicationDetails;

          applicationFound = await this.TransactionHelper.checkApplication(
            applicationId,
            applicationType
          );

          if (!applicationFound) {
            throw new HttpException("Application not found.", HttpStatus.OK);
          }
          let { refundWalletAmountApplied, rewardWalletAmountApplied } =
            applicationFound;
          refundAmount = refundWalletAmountApplied;
          rewardAmount = rewardWalletAmountApplied;

          /**
           * update refund and reward wallet in case of payment declined and failure
           */
          if (
            isPaymentVerified.paymentStatus === paymentStatus.FAILURE &&
            transaction.transactionFor === transactionFor.SERVICE_PAYMENT
          ) {
            //update reward wallet and reward transaction history
            if (rewardAmount > 0) {
              const updateRewardData =
                await this.TransactionHelper.updateRewardWallet(req, orderId);
              if (!updateRewardData.status) {
                console.log(updateRewardData.msg);
              }
            }

            //update refund wallet and refund transaction history
            if (refundAmount > 0) {
              const updateRefundData =
                await this.TransactionHelper.updateRefundWallet(req, orderId);
              if (!updateRefundData.status) {
                console.log(updateRefundData.msg);
              }
            }

            //update  refund and reward amount applied in application
            if (refundAmount > 0 || rewardAmount > 0) {
              const updateApplicationAmt =
                await this.TransactionHelper.updateApplicationAmt(orderId);
              if (!updateApplicationAmt.status) {
                console.log(updateApplicationAmt.msg);
              }
            }
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
}
