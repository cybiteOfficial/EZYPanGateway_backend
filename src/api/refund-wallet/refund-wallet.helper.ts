import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { User, UserDocument } from "../user/entities/user.entity";
import * as moment from "moment";
import {
  RefundWallet,
  RefundWalletDocument,
} from "./entities/refund-wallet.entity";
import {
  RefundWalletTransactions,
  RefundWalletTransactionsDocument,
} from "../refund-wallet-transaction/entities/refund-wallet-transaction.entity";
import {
  UserRewardWallet,
  UserRewardWalletDocument,
} from "../userRewardWallet/entities/userRewardWallet.entity";
import { serviceType } from "../price-config/entities/price-config.entity";
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

export class refundWalletAmt {
  [x: string]: any;
  constructor(
    @InjectModel(RefundWallet.name)
    private refundWalletModel: Model<RefundWalletDocument>,
    @InjectModel(RefundWalletTransactions.name)
    private refundWalletTransactionModel: Model<RefundWalletTransactionsDocument>,
    @InjectModel(User.name)
    private UserModel: Model<UserDocument>,
    @InjectModel(UserRewardWallet.name)
    private UserRewardWalletModel: Model<UserRewardWalletDocument>,
    @InjectModel(PanApplication.name)
    private panAppModel: Model<PanDocument>,
    @InjectModel(ItrApplication.name)
    private itrAppModel: Model<ItrApplicationDocument>,
    @InjectModel(DigitalSign.name)
    private dscAppModel: Model<DigitalSignDocument>,
    @InjectModel(MsmeApplication.name)
    private msmeAppModel: Model<MsmeApplicationDocument>,
    @InjectModel(GumastaApplication.name)
    private gumastaAppModel: Model<GumastaApplicationDocument>
  ) {}

  /**
   * create wallet with zero wallet
   */
  async createWallet(uuid: any, userId: any) {
    // create wallet
    const walletData = {
      walletType: "",
      uuid: uuid,
      walletAmount: 0,
      userId: userId,
    };
    const addZeroRefundWallet = await new this.refundWalletModel({
      ...walletData,
    }).save();

    //create user reward wallet
    const createUserRewardWallet = await new this.UserRewardWalletModel({
      userId: userId,
    }).save();
  }

  /***find application***/
  async findApplication(applicationId, applicationType, req) {
    let applicationFound;
    let resToSend = { message: "", data: null, status: false };

    const query = {
      // $and: [

      _id: new mongoose.Types.ObjectId(applicationId),
      appliedById: req.userData.Id,
      status: status.REJECT,
      isDeleted: false,
      // {
      //   $or: [
      //     {
      //       appliedAsType: req.userData.type,
      //       appliedByType: req.userData.type,
      //     },
      //   ],
      // },
      // ],
    };

    if (applicationType == serviceType.PAN) {
      applicationFound = await this.panAppModel.findById({
        _id: new mongoose.Types.ObjectId(applicationId),
        // appliedById: req.userData.Id,
        status: status.REJECT,
        isDeleted: false,
      });
    }

    if (applicationType == serviceType.ITR) {
      applicationFound = await this.itrAppModel.findById({
        ...query,
      });
    }

    if (applicationType == serviceType.DSC) {
      applicationFound = await this.dscAppModel.findById({
        ...query,
      });
    }

    if (applicationType == serviceType.MSME) {
      applicationFound = await this.msmeAppModel.findById({
        ...query,
      });
    }

    if (applicationType == serviceType.GUMASTA) {
      applicationFound = await this.gumastaAppModel.findById({
        ...query,
      });
    }
    if (applicationFound.status == status.REJECT) {
      return (resToSend = {
        message: "Unable to cancel application. please try again",
        status: false,
        data: null,
      });
    }

    if (applicationFound === null || applicationFound === undefined) {
      resToSend = {
        message: "Application not found.",
        status: false,
        data: null,
      };
    } else {
      resToSend = {
        message: "Application found successfully.",
        status: true,
        data: applicationFound,
      };
    }

    return resToSend;
  }

  /**
   * add amount in refund wallet
   */

  async addRefundAmount(
    req: any,
    amount: number,
    refundUsed: number,
    rewardUsed: number,
    applicationType: any,
    applicationId: any,
    userId: any,
    userDataType: any,
    uniqueTransactionId: any
  ) {
    try {
      const currentDateTime = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      let resToSend = { status: false, Msg: "" };
      const userExist = await this.UserModel.findOne({
        isDeleted: false,
        isActive: true,
        isBlocked: false,
      });
      if (!userExist) {
        resToSend.Msg = "Invalid user.";
      }

      /**find application details***/

      const findOneApplication = await this.findApplication(
        applicationId,
        applicationType,
        req
      );

      if (findOneApplication.status === false) {
        resToSend.Msg = findOneApplication.message;
      }

      /**application details**/
      const applicationFound = findOneApplication.data;

      //check wallet details
      const walletDetails = await this.refundWalletModel.findOne({
        userId: userId,
      });
      if (!walletDetails) {
        resToSend.Msg = "Wallet not found.";
      }

      const walletData = {
        walletAmount: walletDetails.walletAmount + amount,
        // walletAmount:
        // walletDetails.walletAmount + amount + refundUsed + rewardUsed,
      };
      // let creditedAmount = amount + refundUsed + rewardUsed;
      let creditedAmount = amount;
      const walletTransactionData = {
        walletId: walletDetails._id,
        userId: userId,
        applicationType: applicationType,
        applicationId: applicationId,
        uniqueTransactionId: uniqueTransactionId,
        sjbtCode: applicationFound.distributorCode,
        srn: applicationFound.srn,
        transactionType: "CREDIT",
        debitedAmount: 0,
        creditedAmount: creditedAmount,
        dateAndTime: currentDateTime,
        createdByType: userDataType,
        remark: `Refund wallet amount ${creditedAmount} credited For cancelled Application ${applicationType} with SRN ${applicationFound.srn} By User ${req.userData.contactNumber}.`,
        createdById: userId,
      };

      const walletUpdated = await this.refundWalletModel.findByIdAndUpdate(
        { _id: walletDetails._id },
        {
          $set: {
            ...walletData,
          },
        }
      );

      if (!walletUpdated) {
        resToSend.Msg = `Couldn't refund amount.`;
      } else {
        if (creditedAmount > 0) {
          const userLogsToUpdate = await this.UserModel.findOneAndUpdate(
            { _id: userId, is_deleted: false },
            {
              $push: {
                logs: `Refund amount ${amount} of cancelled application ${applicationType} with SRN ${applicationFound.srn} added in wallet by user ${userDataType} on ${currentDateTime} `,
              },
            }
          );

          const walletTransactionCreated =
            await new this.refundWalletTransactionModel({
              ...walletTransactionData,
            }).save();

          const msgToSend = "";
          if (walletTransactionCreated) {
            resToSend = {
              status: true,
              Msg: "Amount successfully added in wallet.",
            };
          } else {
            if (!walletTransactionCreated) {
              resToSend.Msg = "Couldn't add walletTransaction details.";
            }
            resToSend.Msg = "Please try to add manually.";
          }
          return resToSend;
        } else {
          return true;
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
}
