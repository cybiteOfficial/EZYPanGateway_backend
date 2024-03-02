/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, mongo } from "mongoose";
import {
  PanApplication,
  PanDocument,
  status,
} from "../panapplications/entities/pan.entity";
import {
  ItrApplication,
  ItrApplicationDocument,
} from "../itr-application/entities/itr-application.entity";
import {
  DigitalSign,
  DigitalSignDocument,
} from "../digital-sign/entities/digital-sign.entity";
import {
  MsmeApplication,
  MsmeApplicationDocument,
} from "../msme-application/entities/msme-application.entity";
import {
  GumastaApplication,
  GumastaApplicationDocument,
} from "../gumasta-application/entities/gumasta-application.entity";
import {
  Transaction,
  TransactionDocument,
  transactionFor,
} from "./entities/transaction.entity";
import { HttpException, HttpStatus } from "@nestjs/common";
import * as moment from "moment";
import { Role, User, UserDocument } from "../user/entities/user.entity";
import { AddLogFunction } from "../../helper/addLog";
import { PanCart, PanCartDocument } from "../pan-cart/entities/pan-cart.entity";
import {
  GumastaCart,
  GumastaCartDocument,
} from "../gumasta-cart/entities/gumasta-cart.entity";
import {
  MsmeCart,
  MsmeCartDocument,
} from "../msme-cart/entities/msme-cart.entity";
import { ItrCart, ItrCartDocument } from "../itr-cart/entities/itr-cart.entity";
import { DscCart, DscCartDocument } from "../dsc-cart/entities/dsc-cart.entity";
import { errorRes } from "../../helper/errorRes";
import {
  RewardHistory,
  RewardHistoryDocument,
} from "../rewardHistory/entities/rewardHistory.entity";
import {
  UserRewardWallet,
  UserRewardWalletDocument,
} from "../userRewardWallet/entities/userRewardWallet.entity";
import {
  RefundWalletTransactions,
  RefundWalletTransactionsDocument,
  transactionType,
} from "../refund-wallet-transaction/entities/refund-wallet-transaction.entity";
import { rewardFor } from "../rewardHistory/entities/rewardHistory.entity";

import {
  RefundWallet,
  RefundWalletDocument,
} from "../refund-wallet/entities/refund-wallet.entity";
import { serviceType } from "../price-config/entities/price-config.entity";
import {
  DigitalPanWallet,
  DigitalPanWalletDocument,
} from "../digital-pan-wallet/entities/digital-pan-wallet.entity";
import {
  DigitalPanTransactions,
  DigitalPanTransactionsDocument,
} from "../digital-pan-wallet-transaction/entities/digital-pan-wallet-transaction.entity";
import { checkSubscriptionPlan } from "../subscription-plan/subscription-plan.helper";
import { SubscriptionType } from "../subscription-flow/entities/subscription-flow.entity";
import { sendMsg91Function } from "../../helper/smsSend.helper";
import { EmailService } from "src/helper/sendEmail";
import {
  PanApplicationFlow,
  PanApplicationFlowDocument,
} from "../pan-application-flow/entities/pan-application-flow.entity";
import {
  ItrApplicationFlow,
  ItrApplicationFlowDocument,
} from "../itr-application-flow/entities/itr-application-flow.entity";
import {
  DigitalSignFlow,
  DigitalSignFlowDocument,
} from "../digital-sign-flow/entities/digital-sign-flow.entity";
import {
  GumastaApplicationFlow,
  GumastaApplicationFlowDocument,
} from "../gumasta-application-flow/entities/gumasta-application-flow.entity";
import {
  MsmeApplicationFlow,
  MsmeApplicationFlowDocument,
} from "../msme-application-flow/entities/msme-application-flow.entity";
const { ObjectId } = require("mongodb");

export class TransactionHelper {
  constructor(
    @InjectModel(PanApplication.name)
    private readonly panAppModel: Model<PanDocument>,
    @InjectModel(DigitalPanWallet.name)
    private readonly DigitalPanWalletModel: Model<DigitalPanWalletDocument>,
    @InjectModel(DigitalPanTransactions.name)
    private readonly DigitalPanWalletTransactionModel: Model<DigitalPanTransactionsDocument>,
    @InjectModel(ItrApplication.name)
    private readonly itrApplicationModel: Model<ItrApplicationDocument>,
    @InjectModel(DigitalSign.name)
    private readonly digitalSignModel: Model<DigitalSignDocument>,
    @InjectModel(MsmeApplication.name)
    private readonly msmeApplicationModel: Model<MsmeApplicationDocument>,
    @InjectModel(GumastaApplication.name)
    private readonly GumastaApplicationModel: Model<GumastaApplicationDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(PanCart.name)
    private readonly panCartModel: Model<PanCartDocument>,
    @InjectModel(DscCart.name)
    private readonly DscCartModel: Model<DscCartDocument>,
    @InjectModel(MsmeCart.name)
    private readonly MsmeCartModel: Model<MsmeCartDocument>,
    @InjectModel(ItrCart.name)
    private readonly ItrCartModel: Model<ItrCartDocument>,
    @InjectModel(RewardHistory.name)
    private readonly RewardHistoryModel: Model<RewardHistoryDocument>,
    @InjectModel(UserRewardWallet.name)
    private readonly UserRewardWalletModel: Model<UserRewardWalletDocument>,
    @InjectModel(RefundWallet.name)
    private readonly RefundWalletModel: Model<RefundWalletDocument>,
    @InjectModel(RefundWalletTransactions.name)
    private readonly RefundWalletTransactionsModel: Model<RefundWalletTransactionsDocument>,
    @InjectModel(GumastaCart.name)
    private readonly GumastaCartModel: Model<GumastaCartDocument>,
    @InjectModel(PanApplicationFlow.name)
    private readonly PanAppFlowModel: Model<PanApplicationFlowDocument>,
    @InjectModel(ItrApplicationFlow.name)
    private readonly ItrApplicationFlowModel: Model<ItrApplicationFlowDocument>,
    @InjectModel(DigitalSignFlow.name)
    private readonly DigitalSignFlowModel: Model<DigitalSignFlowDocument>,
    @InjectModel(GumastaApplicationFlow.name)
    private readonly GumastaApplicationFlowModel: Model<GumastaApplicationFlowDocument>,
    @InjectModel(MsmeApplicationFlow.name)
    private readonly MsmeApplicationFlowModel: Model<MsmeApplicationFlowDocument>,
    private readonly addLogFunction: AddLogFunction,
    private readonly EmailService: EmailService,
    private readonly subscriptionExpiry: checkSubscriptionPlan
  ) {}

  async updateApplicationStatus(service, query, dataToBeUpdate) {
    switch (service) {
      case "PAN":
        return await this.panAppModel.findOneAndUpdate(
          { ...query },
          {
            ...dataToBeUpdate,
          },
          {
            new: true,
          }
        );
        break;
      case "ITR":
        return this.itrApplicationModel.findOneAndUpdate(
          { ...query },
          {
            ...dataToBeUpdate,
          },
          {
            new: true,
          }
        );
        break;
      case "DSC":
        return this.digitalSignModel.findOneAndUpdate(
          { ...query },
          {
            ...dataToBeUpdate,
          },
          {
            new: true,
          }
        );
        break;
      case "GUMASTA":
        return this.GumastaApplicationModel.findOneAndUpdate(
          { ...query },
          {
            ...dataToBeUpdate,
          },
          {
            new: true,
          }
        );
        break;
      case "MSME":
        return this.msmeApplicationModel.findOneAndUpdate(
          { ...query },
          {
            ...dataToBeUpdate,
          },
          {
            new: true,
          }
        );
        break;
      case "DIGITAL_PAN":
        return "DIGITAL_PAN";
        break;
    }
  }

  async checkApplication(applicationId, applicationType) {
    let applicationFound;

    if (applicationType == serviceType.PAN) {
      applicationFound = await this.panAppModel.findOne({
        _id: applicationId,
      });
    }

    if (applicationType == serviceType.ITR) {
      applicationFound = await this.itrApplicationModel.findOne({
        _id: applicationId,
      });
    }

    if (applicationType == serviceType.DSC) {
      applicationFound = await this.digitalSignModel.findOne({
        _id: applicationId,
      });
    }

    if (applicationType == serviceType.MSME) {
      applicationFound = await this.msmeApplicationModel.findOne({
        _id: applicationId,
      });
    }

    if (applicationType == serviceType.GUMASTA) {
      applicationFound = await this.GumastaApplicationModel.findOne({
        _id: applicationId,
      });
    }

    return applicationFound;
  }

  async updateApplicationFlow(
    applicationId,
    applicationType,
    statusToBeUpdate
  ) {
    if (applicationType == serviceType.PAN) {
      let applicationFound = await this.panAppModel.findOne({
        _id: new mongoose.Types.ObjectId(applicationId),
      });
      const updatedPanFlow = await new this.PanAppFlowModel({
        panApplicationId: applicationId,
        status: statusToBeUpdate,
        ...applicationFound.toObject(),
        _id: new ObjectId(),
      }).save();
    }

    if (applicationType == serviceType.ITR) {
      let applicationFound = await this.itrApplicationModel.findOne({
        _id: new mongoose.Types.ObjectId(applicationId),
      });
      const updateITrFlow = await new this.ItrApplicationFlowModel({
        itrApplicationId: applicationId,
        status: statusToBeUpdate,
        ...applicationFound.toObject(),
        _id: new ObjectId(),
      }).save();
    }

    if (applicationType == serviceType.DSC) {
      let applicationFound = await this.digitalSignModel.findOne({
        _id: new mongoose.Types.ObjectId(applicationId),
      });
      const updateDscFlow = await new this.DigitalSignFlowModel({
        digitalSignId: applicationId,
        status: statusToBeUpdate,
        ...applicationFound.toObject(),
        _id: new ObjectId(),
      }).save();
    }

    if (applicationType == serviceType.MSME) {
      let applicationFound = await this.msmeApplicationModel.findOne({
        _id: new mongoose.Types.ObjectId(applicationId),
      });
      const updatedmsmeFlow = await new this.MsmeApplicationFlowModel({
        msmeApplicationId: applicationId,
        status: statusToBeUpdate,
        ...applicationFound.toObject(),
        _id: new ObjectId(),
      }).save();
    }

    if (applicationType == serviceType.GUMASTA) {
      let applicationFound = await this.GumastaApplicationModel.findOne({
        _id: new mongoose.Types.ObjectId(applicationId),
      });
      const updateGumastaFlow = await new this.GumastaApplicationFlowModel({
        gumastaApplicationId: applicationId,
        status: statusToBeUpdate,
        ...applicationFound.toObject(),
        _id: new ObjectId(),
      }).save();
    }

    return true;
  }

  async updateTxnStatus(
    isCron: any,
    paymentStatus: any,
    uniqueTransactionId: any,
    txnDataToBeUpdated: any,
    appOrUserDataToBeUpdate: any,
    req: any,
    res: any
  ) {
    let resDataToSend = { status: false, msg: "" };
    const currentTime = moment()
      .utcOffset("+05:30")
      .format("YYYY-MM-DD HH:mm:ss");
    const txnExist = await this.transactionModel.findOne({
      uniqueTransactionId: uniqueTransactionId,
    });

    if (!txnExist) {
      resDataToSend.msg = "Transaction not found.";
    }
    const { userId, userType } = txnExist;

    const userData = await this.userModel.findOne({ _id: userId });

    const txnUpdated = await this.transactionModel.findOneAndUpdate(
      { _id: txnExist._id },
      {
        ...txnDataToBeUpdated,
      },
      {
        new: true,
      }
    );

    if (!txnUpdated) {
      resDataToSend.msg = "Something went wrong.";
    }

    resDataToSend.status = true;
    let loggMsg = `${userType} ${userData.name} completed payment for `;

    if (txnExist.transactionFor === transactionFor.SERVICE_PAYMENT) {
      const applicationStatusesUpdated = [];
      let dataToUpdate = {};
      for (const applicationDetails of txnExist.applicationDetails) {
        const { applicationType, applicationId, srn } = applicationDetails;
        let statusToBeUpdate =
          paymentStatus === "SUCCESS" ? status.PENDING : status.BLANK;

        if (isCron == "NO") {
          dataToUpdate = {
            status: statusToBeUpdate,
            ...appOrUserDataToBeUpdate,
            appliedOnDate: currentTime,
          };
        } else {
          dataToUpdate = {
            status: statusToBeUpdate,
            ...appOrUserDataToBeUpdate,
          };
        }

        const applicationStatusUpdated = await this.updateApplicationStatus(
          applicationType,
          { _id: applicationId, status: "PAYMENT_PENDING" },
          { ...dataToUpdate }
        );

        const updateApplicationFlow = await this.updateApplicationFlow(
          applicationId,
          applicationType,
          statusToBeUpdate
        );

        const deleteApplicationFromCart = await this.deleteApplicationFromCart(
          txnExist.applicationDetails,
          res
        );

        loggMsg += `${applicationType.toLowerCase()} application ${srn},`;

        applicationStatusesUpdated.push(applicationStatusUpdated);
      }
      if (txnExist.cartItemsApplicationIds.length) {
        // const deleteApplicationFromCart = await this.deleteApplicationFromCart(
        //   txnExist.cartItemsApplicationIds,
        //   res
        // );

        const updateApplications = await this.updateCartApplications(
          txnExist.cartItemsApplicationIds,
          dataToUpdate
        );
      }
    }

    if (txnExist.transactionFor === transactionFor.SUBSCRIPTION_PLAN) {
      const userStatusesUpdated = [];
      /**get subscription plan */
      let expiryTime =
        userData.subscriptionType === SubscriptionType.ANNUAL ? 365 : 0;
      let subscriptionType = userData.subscriptionType;
      let subscriptionExpiryDate = userData.subscriptionPlanExpiryDate;

      let expiryDate = await this.subscriptionExpiry.expiryDate(
        expiryTime,
        subscriptionExpiryDate,
        subscriptionType
      );

      if (userData.subscriptionType === SubscriptionType.LIFETIME) {
        expiryDate = "";
      }
      const userStatusUpdated = await this.updateUserSubscriptionStatus(
        txnExist.userId,
        {
          ...appOrUserDataToBeUpdate,
          subscriptionPlanExpiryDate:
            paymentStatus === "SUCCESS"
              ? expiryDate
              : userData.subscriptionPlanExpiryDate,
        }
      );

      loggMsg += `${txnExist.transactionFor.toLowerCase()},`;

      userStatusesUpdated.push(userStatusUpdated);
    }

    loggMsg += ` at ${currentTime}. `;
    /**
     * iftransaction for distributor
     */

    await this.addLogFunction.logAdd(
      req,
      userType,
      userId,
      "TRANSACTION",
      "PAYMENT_VERIFY",
      uniqueTransactionId,
      true,
      201,
      loggMsg,
      "Transaction updated Successfully.",
      req?.socket.remoteAddress
    );
    return resDataToSend;
  }

  async updateUserSubscriptionStatus(userId, dataToBeUpdate) {
    const userFound = await this.userModel.findOne({
      _id: userId,
      isDeleted: false,
      isActive: true,
      isBlocked: false,
    });

    return await this.userModel.findByIdAndUpdate(
      {
        _id: userFound._id,
      },
      {
        ...dataToBeUpdate,
      },
      {
        new: true,
      }
    );
  }

  async deleteApplicationFromCart(applicationDataArray, res) {
    for (let eachItem in applicationDataArray) {
      const applicationDetails = applicationDataArray[eachItem];

      const { applicationType, cartAppliationId } = applicationDetails;

      switch (applicationType) {
        case "PAN":
          await this.panCartModel.findOneAndDelete({
            _id: new mongoose.Types.ObjectId(cartAppliationId),
          });
          break;

        case "ITR":
          await this.ItrCartModel.findOneAndDelete({
            _id: new mongoose.Types.ObjectId(cartAppliationId),
          });
          break;

        case "MSME":
          await this.MsmeCartModel.findOneAndDelete({
            _id: new mongoose.Types.ObjectId(cartAppliationId),
          });
          break;

        case "GUMASTA":
          await this.GumastaCartModel.findOneAndDelete({
            _id: new mongoose.Types.ObjectId(cartAppliationId),
          });
          break;

        case "DSC":
          await this.DscCartModel.findOneAndDelete({
            _id: new mongoose.Types.ObjectId(cartAppliationId),
          });
          break;
      }
    }
    return true;
  }

  async deleteFailedApplication(applicationDataArray, res) {
    for (let eachItem in applicationDataArray) {
      const applicationDetails = applicationDataArray[eachItem];

      const { applicationType, cartAppliationId } = applicationDetails;
      let applications;
      switch (applicationType) {
        case "PAN":
          applications = await this.panAppModel.find({
            cartApplicationId: cartAppliationId,
            status: status.BLANK,
          });
          for (let each in applications) {
            let { _id } = applications[each];
            let deleteApplications = await this.panAppModel.findByIdAndDelete({
              _id: _id,
            });
          }
          break;

        case "ITR":
          applications = await this.itrApplicationModel.find({
            cartApplicationId: cartAppliationId,
            status: status.BLANK,
          });
          for (let each in applications) {
            let { _id } = applications[each];
            let deleteApplications =
              await this.itrApplicationModel.findByIdAndDelete({ _id: _id });
          }
          break;

        case "MSME":
          applications = await this.msmeApplicationModel.find({
            cartApplicationId: cartAppliationId,
            status: status.BLANK,
          });
          for (let each in applications) {
            let { _id } = applications[each];
            let deleteApplications =
              await this.msmeApplicationModel.findByIdAndDelete({ _id: _id });
          }
          break;

        case "GUMASTA":
          applications = await this.GumastaApplicationModel.find({
            cartApplicationId: cartAppliationId,
            status: status.BLANK,
          });
          for (let each in applications) {
            let { _id } = applications[each];
            let deleteApplications =
              await this.GumastaApplicationModel.findByIdAndDelete({
                _id: _id,
              });
          }
          break;

        case "DSC":
          applications = await this.digitalSignModel.find({
            cartApplicationId: cartAppliationId,
            status: status.BLANK,
          });
          for (let each in applications) {
            let { _id } = applications[each];
            let deleteApplications =
              await this.digitalSignModel.findByIdAndDelete({ _id: _id });
          }
          break;
      }
    }
    return true;
  }

  async updateCartApplications(applicationDataArray, query) {
    for (let eachItem in applicationDataArray) {
      const applicationDetails = applicationDataArray[eachItem];

      const { applicationType, cartAppliationId } = applicationDetails;
      let applications;
      switch (applicationType) {
        case "PAN":
          applications = await this.panAppModel.find({
            cartApplicationId: cartAppliationId,
            status: status.BLANK,
          });
          for (let each in applications) {
            let { _id } = applications[each];
            let updateApplicationStatus =
              await this.panAppModel.findByIdAndUpdate(
                {
                  _id: _id,
                },
                {
                  $set: { ...query },
                },
                { new: true }
              );
          }
          break;

        case "ITR":
          applications = await this.itrApplicationModel.find({
            cartApplicationId: cartAppliationId,
            status: status.BLANK,
          });
          for (let each in applications) {
            let { _id } = applications[each];
            let updateApplicationStatus =
              await this.itrApplicationModel.findByIdAndUpdate(
                { _id: _id },
                {
                  $set: { ...query },
                },
                { new: true }
              );
          }
          break;

        case "MSME":
          applications = await this.msmeApplicationModel.find({
            cartApplicationId: cartAppliationId,
            status: status.BLANK,
          });
          for (let each in applications) {
            let { _id } = applications[each];
            let updateApplicationStatus =
              await this.msmeApplicationModel.findByIdAndUpdate(
                { _id: _id },
                {
                  $set: { ...query },
                },
                { new: true }
              );
          }
          break;

        case "GUMASTA":
          applications = await this.GumastaApplicationModel.find({
            cartApplicationId: cartAppliationId,
            status: status.BLANK,
          });
          for (let each in applications) {
            let { _id } = applications[each];
            let updateApplicationStatus =
              await this.GumastaApplicationModel.findByIdAndUpdate(
                {
                  _id: _id,
                },
                {
                  $set: { ...query },
                },
                { new: true }
              );
          }
          break;

        case "DSC":
          applications = await this.digitalSignModel.find({
            cartApplicationId: cartAppliationId,
            status: status.BLANK,
          });
          for (let each in applications) {
            let { _id } = applications[each];
            let updateApplicationStatus =
              await this.digitalSignModel.findByIdAndUpdate(
                { _id: _id },
                {
                  $set: { ...query },
                },
                { new: true }
              );
          }
          break;
      }
    }
    return true;
  }

  async updateRewardWallet(req, orderId) {
    let resDataToSend = { status: false, msg: "" };
    let rewardHistoryFound = await this.RewardHistoryModel.find({
      rewardTransactionType: transactionType.DEBIT,
      rewardUsedFor: rewardFor.APPLICATIONAPPLIED,
      uniqueTransactionId: orderId,
    });

    let rewardAmountFound = [];

    for (const each in rewardHistoryFound) {
      let { uniqueTransactionId, srn, applicationType, applicationId } =
        rewardHistoryFound[each];
      let applicationFound = await this.checkApplication(
        applicationId,
        applicationType
      );

      let { rewardWalletAmountApplied } = applicationFound;
      rewardAmountFound.push({ reward: rewardWalletAmountApplied });
    }

    if (!rewardHistoryFound.length) {
      resDataToSend = { status: false, msg: "Reward history not found." };
    }

    //update reward transactions

    let totalRewardPoint = rewardAmountFound.reduce((sum, el) => {
      return sum + el.reward;
    }, 0);

    let userid = "";
    rewardHistoryFound.forEach(async (el) => {
      userid = el.userId;
      const rewardHistoryDataToUpdate = {
        userId: el.userId,
        points: el.points,
        rewardPointValue: el.rewardPointValue,
        applicationType: el.applicationType,
        applicationId: el.applicationId,
        uniqueTransactionId: el.uniqueTransactionId,
        srn: el.srn,
        sjbtCode: el.sjbtCode,
        mobileNumber: el.mobileNumber,
        retailerId: "",
        rewardFor: el.rewardFor,
        rewardTransactionType: transactionType.CREDIT,
        logs: `DISTRIBUTOR  credited ${el.points} reward point for application ${el.applicationType} due to application failed.`,
      };

      const rewardHistory = await this.RewardHistoryModel.create({
        ...rewardHistoryDataToUpdate,
      });
    });

    //update reward wallet
    let rewardWalletFound = await this.UserRewardWalletModel.findOne({
      userId: userid,
      isDeleted: false,
      isActive: true,
    });
    let { totalReward } = rewardWalletFound;
    let rewardAmountUsedInApplication = totalRewardPoint;
    let currentWalletAmt = totalReward + rewardAmountUsedInApplication;

    if (!rewardWalletFound) {
      resDataToSend.msg = "Reward wallet not found.";
      // throw new HttpException('Reward wallet not found.', HttpStatus.OK);
    }

    const rewardWalletUpdated =
      await this.UserRewardWalletModel.findByIdAndUpdate(
        {
          _id: rewardWalletFound._id,
        },
        {
          $set: {
            totalReward: currentWalletAmt,
          },
        },
        { new: true }
      );
    if (rewardWalletUpdated) {
      resDataToSend.status = true;
      resDataToSend.msg = "Reward wallet updated successfully.";
    }
    return resDataToSend;
  }

  async updateRefundWallet(req, orderId) {
    let resDataToSend = { status: false, msg: "" };
    let refundHistoryFound = await this.RefundWalletTransactionsModel.find({
      transactionType: transactionType.DEBIT,
      uniqueTransactionId: orderId,
    });

    //update refund transactions
    let user_id;
    let totalRefundAmount = refundHistoryFound.reduce((sum, el) => {
      return sum + el.debitedAmount;
    }, 0);

    refundHistoryFound.forEach(async (el) => {
      user_id = el.userId;
      const refundWalletTransactionsToBeInsert = {
        walletId: el.walletId,
        userId: el.userId,
        applicationType: el.applicationType,
        applicationId: el.applicationId,
        transactionType: transactionType.CREDIT,
        uniqueTransactionId: el.uniqueTransactionId,
        debitedAmount: 0,
        creditedAmount: el.debitedAmount,
        dateAndTime: el.dateAndTime,
        createdByType: el.createdByType,
        remark: `Refund wallet amount ${el.debitedAmount} credited due to payment failed for application ${el.applicationType}.`,
        createdById: el.createdById,
      };

      const refundHistory = await this.RefundWalletTransactionsModel.create({
        ...refundWalletTransactionsToBeInsert,
      });
    });

    //update refund wallet
    let refundWalletFound = await this.RefundWalletModel.findOne({
      userId: user_id,
      isDeleted: false,
      isActive: true,
    });

    if (!refundWalletFound) {
      resDataToSend.msg = "Refund wallet not found.";
    }

    let { walletAmount } = refundWalletFound;
    let refundAmountUsedInApplication = totalRefundAmount;
    let currentWalletAmt = walletAmount + refundAmountUsedInApplication;

    const refundWalletUpdated = await this.RefundWalletModel.findByIdAndUpdate(
      {
        _id: refundWalletFound._id,
      },
      {
        $set: {
          walletAmount: currentWalletAmt,
        },
      },
      { new: true }
    );
    if (!refundWalletUpdated) {
      resDataToSend = { status: false, msg: `Couldn't update refund wallet` };
    } else {
      resDataToSend = {
        status: true,
        msg: `refund wallet updated successfully`,
      };
    }
    return resDataToSend;
  }

  async updateApplicationAmt(uniqueTransactionId: any) {
    let resDataToSend = { status: false, msg: "" };
    const txnExist = await this.transactionModel.findOne({
      uniqueTransactionId: uniqueTransactionId,
    });

    if (!txnExist) {
      resDataToSend.msg = "Transaction not found.";
    }

    for (const applicationDetails of txnExist.applicationDetails) {
      const { applicationType, applicationId, srn } = applicationDetails;

      let applicationFound = await this.checkApplication(
        applicationId,
        applicationType
      );
      if (!applicationFound) {
        resDataToSend.msg = "Application not found.";
      }
      let { totalPrice, refundWalletAmountApplied, rewardWalletAmountApplied } =
        applicationFound;
      let totalPriceToBeUpdate =
        totalPrice + refundWalletAmountApplied + rewardWalletAmountApplied;

      let query = {
        totalPrice: totalPriceToBeUpdate,
        refundWalletAmountApplied: 0,
        rewardWalletAmountApplied: 0,
      };
      //update application amout usedRefund and userRewardWallet
      const applicationAmountUpdated = await this.updateApplicationStatus(
        applicationType,
        { _id: applicationId },
        { ...query }
      );
      if (applicationAmountUpdated) {
        /****add flow */
        const updateApplicationFlow = await this.updateApplicationFlow(
          applicationId,
          applicationType,
          applicationFound.status
        );

        resDataToSend.status = true;
        resDataToSend.msg = "Application amount updated successfully.";
      } else {
        resDataToSend.status = false;
        resDataToSend.msg = `Couldn't update application amount.`;
      }
    }

    //add remark of refund and reward wallet amount applied.
    return resDataToSend;
  }

  async updateDigitalPanWallet(req, orderId, isPaymentVerified) {
    let resDataToSend = { status: false, msg: "" };
    const currentDate = moment()
      .utcOffset("+05:30")
      .format("YYYY-MM-DD HH:mm:ss");

    const txnExist = await this.transactionModel.findOne({
      uniqueTransactionId: orderId,
    });

    if (!txnExist) {
      resDataToSend.msg = "Transaction not found.";
    }
    let { userId, totalAmount, reqData, userType } = txnExist;

    let digitalPanWallet = await this.DigitalPanWalletModel.findOne({
      userId: userId,
    });
    if (!digitalPanWallet) {
      resDataToSend = { status: false, msg: "Digital pan wallet not found." };
    }

    let { _id, walletAmount } = digitalPanWallet;

    let walletAmtToBeUpdate = walletAmount + totalAmount;

    let digitalPanWalletToBeUpdate =
      await this.DigitalPanWalletModel.findByIdAndUpdate(
        {
          _id: _id,
        },
        { $inc: { walletAmount: totalAmount } },
        { new: true }
      );
    if (!digitalPanWalletToBeUpdate) {
      resDataToSend.msg = `Couldn't update digital pan Wallet.`;
    }
    let userData = await this.userModel.findOne({
      _id: new mongoose.Types.ObjectId(digitalPanWallet.userId),
    });
    if (!userData) {
      resDataToSend.msg = `user not found.`;
    }
    let DigitalwalletTransactionToBeCreate = {
      walletId: _id.toString(),
      userId: digitalPanWallet.userId,
      uniqueTransactionId: orderId,
      remark: `Wallet recharged with amount ${totalAmount} credited by  user ${userData.mobileNumber}.`,
      transactionType: transactionType.CREDIT,
      paymentStatus: isPaymentVerified,
      creditedAmount: totalAmount,
      createdByType: userType,
      createdById: digitalPanWallet.userId,
      dateAndTime: currentDate,
    };
    let digitalPanWalletTransactionHistory =
      await new this.DigitalPanWalletTransactionModel({
        ...DigitalwalletTransactionToBeCreate,
      }).save();

    if (!digitalPanWalletTransactionHistory) {
      resDataToSend.msg = `Couldn't update digital pan wallet history.`;
    } else {
      resDataToSend.status = true;
      resDataToSend.msg = `wallet updated successfully.`;
    }

    return resDataToSend;
  }

  async createDigitalPanWalletHistory(req, orderId, isPaymentVerified) {
    let resDataToSend = { status: false, msg: "" };
    const currentDate = moment()
      .utcOffset("+05:30")
      .format("YYYY-MM-DD HH:mm:ss");

    const txnExist = await this.transactionModel.findOne({
      uniqueTransactionId: orderId,
    });

    if (!txnExist) {
      resDataToSend.msg = "Transaction not found.";
    }
    let { userId, totalAmount, reqData, userType } = txnExist;

    let digitalPanWallet = await this.DigitalPanWalletModel.findOne({
      userId: userId,
    });
    if (!digitalPanWallet) {
      resDataToSend = { status: false, msg: "Digital pan wallet not found." };
    }

    let { _id, walletAmount } = digitalPanWallet;
    let userData = await this.userModel.findOne({
      _id: new mongoose.Types.ObjectId(digitalPanWallet.userId),
    });
    if (!userData) {
      resDataToSend.msg = `user not found.`;
    }
    let DigitalwalletTransactionToBeCreate = {
      walletId: _id.toString(),
      userId: digitalPanWallet.userId,
      uniqueTransactionId: orderId,
      remark: `Wallet recharge with amount ${totalAmount} failed for user ${userData.mobileNumber}.`,
      transactionType: "",
      paymentStatus: isPaymentVerified,
      creditedAmount: 0,
      createdByType: userType,
      createdById: digitalPanWallet.userId,
      dateAndTime: currentDate,
    };
    let digitalPanWalletTransactionHistory =
      await new this.DigitalPanWalletTransactionModel({
        ...DigitalwalletTransactionToBeCreate,
      }).save();

    if (!digitalPanWalletTransactionHistory) {
      resDataToSend.msg = `Couldn't update digital pan wallet history.`;
    } else {
      resDataToSend.status = true;
      resDataToSend.msg = `wallet updated successfully.`;
    }

    return resDataToSend;
  }

  /** send refrence number to mobile*/
  async sendSmsRefno(applicationFound, mobiles, applicantName, srn) {
    let userFound = await this.userModel.findOne({
      _id: new mongoose.Types.ObjectId(applicationFound.appliedById),
    });
    if (!userFound) {
      console.log("user not found");
    }

    let msg91Data = {
      template_id: process.env.MSG91_PAN_REGISTRATION_TEMPLATE_ID,
      sender: process.env.MSG91_SENDER_ID,
      short_url: "0",
      mobiles: "+91" + userFound.mobileNumber,
      name: applicantName,
      refno: srn,
    };

    const msgSent: any = await sendMsg91Function(msg91Data);

    if (!msgSent || !msgSent.sendStatus) {
      console.log(msgSent.sendStatus);
    }
    return true;
  }

  /** send refrence number to email*/
  async sendEmailRefno(applicationType, applicationFound) {
    let userFound = await this.userModel.findOne({
      _id: new mongoose.Types.ObjectId(applicationFound.appliedById),
    });
    if (!userFound) {
      console.log("user not found");
    }

    let emailId =
      userFound.userType === Role.GUEST
        ? applicationFound.email
        : userFound.email;
    let sendEmailRefNo;
    if (applicationType === "PAN") {
      sendEmailRefNo = await this.EmailService.sendEmailRefNoTemplate(
        {
          applicationType: applicationType,
          name: applicationFound.name.toUpperCase(),
          refNo: applicationFound.srn,
        },
        emailId
      );
    }
    if (applicationType === "DSC") {
      sendEmailRefNo = await this.EmailService.sendEmailRefNoTemplate(
        {
          applicationType: applicationType,
          name: applicationFound.propritorName.toUpperCase(),
          refNo: applicationFound.srn,
        },
        emailId
      );
    }
    if (applicationType === "MSME") {
      sendEmailRefNo = await this.EmailService.sendEmailRefNoTemplate(
        {
          applicationType: applicationType,
          name: applicationFound.propritorName.toUpperCase(),
          refNo: applicationFound.srn,
        },
        emailId
      );
    }
    if (applicationType === "GUMASTA") {
      sendEmailRefNo = await this.EmailService.sendEmailRefNoTemplate(
        {
          applicationType: applicationType,
          name: applicationFound.propritorName.toUpperCase(),
          refNo: applicationFound.srn,
        },
        emailId
      );
    }
    if (applicationType === "ITR") {
      sendEmailRefNo = await this.EmailService.sendEmailRefNoTemplate(
        {
          applicationType: applicationType,
          name: applicationFound.firstName.toUpperCase(),
          refNo: applicationFound.srn,
        },
        emailId
      );
    }

    if (!sendEmailRefNo) {
      console.log("email not sent");
    }
    return true;
  }
}
