import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import * as moment from "moment";
import mongoose, { Model } from "mongoose";
import { AddLogFunction } from "../../helper/addLog";
import { errorRes } from "../../helper/errorRes";
import {
  RefundWallet,
  RefundWalletDocument,
} from "./entities/refund-wallet.entity";
import { InjectModel } from "@nestjs/mongoose";
import { User, UserDocument } from "../user/entities/user.entity";
import {
  RefundWalletTransactions,
  RefundWalletTransactionsDocument,
  transactionType,
} from "../refund-wallet-transaction/entities/refund-wallet-transaction.entity";

@Injectable()
export class RefundWalletService {
  [x: string]: any;
  constructor(
    @InjectModel(RefundWallet.name)
    private RefundWalletModel: Model<RefundWalletDocument>,
    @InjectModel(RefundWalletTransactions.name)
    private RefundWalletTransactionsModel: Model<RefundWalletTransactionsDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private readonly addLogFunction: AddLogFunction
  ) {}

  //-------------------------------------------------------------------------
  /***
   * find refund wallet
   */
  //-------------------------------------------------------------------------

  async view(id, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      let query = {
        userId: req.userData.Id,
      };
      if (req.route.path.includes("/admin/")) {
        query = {
          userId: id,
        };
      }

      const dataFound = await this.RefundWalletModel.aggregate([
        {
          $match: {
            ...query,
          },
        },
        {
          $addFields: {
            user_id: { $toObjectId: "$userId" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $addFields: {
            userName: { $arrayElemAt: ["$user.name", 0] },
            email: { $arrayElemAt: ["$user.email", 0] },
            mobileNumber: { $arrayElemAt: ["$user.mobileNumber", 0] },
            wallet_amount: {
              $cond: {
                if: { $lt: ["$walletAmount", "$freezeAmount"] },
                then: 0, // Set to 0 if walletAmount is less than freezeAmount
                else: { $subtract: ["$walletAmount", "$freezeAmount"] },
              },
            },
          },
        },
        {
          $unset: "user",
        },
      ]);

      if (!dataFound) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }
      this.addLogFunction.logAdd(
        req,
        requestedType,
        requestedId,
        "REFUND_WALLET",
        "REFUND_WALLET_VIEW",
        id,
        true,
        200,
        `${requestedType} having contact number ${
          req.userData?.contactNumber || ""
        } viewed their wallet details.`,
        "Data found successfully.",
        req.socket.remoteAddress
      );
      return res.status(200).send({
        message: "Data found successfully.",
        status: true,
        data: dataFound,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      const errData = errorRes(err);
      this.addLogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "REFUND_WALLET",
        "REFUND_WALLET_VIEW",
        req.userData.Id,
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to view wallet details ${
          req.userData.Id
        } with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
  //-------------------------------------------------------------------------
  /***
   * refund wallet update api for client
   */
  //-------------------------------------------------------------------------

  async updateWalletByAdmin(id, res, req) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");
      let { userId, amountToBeUpdate } = req.body;

      if (requestedType !== "SUPER_ADMIN") {
        throw new HttpException(
          "You don't have permission to access this route.",
          HttpStatus.OK
        );
      }
      // let transactionTypeToUpdate = req.body.transactionType.toUpperCase();
      let query = {
        _id: new mongoose.Types.ObjectId(userId),
        isDeleted: false,
      };

      /**get userId***/
      const userFound = await this.userModel.findOne({
        ...query,
      });

      if (!userFound) {
        throw new HttpException("User not found.", HttpStatus.OK);
      }

      /**get wallet***/
      const userWallet = await this.RefundWalletModel.findOne({
        userId: userId,
        isDeleted: false,
      });

      if (!userWallet) {
        throw new HttpException("Refund Wallet not found.", HttpStatus.OK);
      }

      const dataFound = await this.RefundWalletModel.findOneAndUpdate(
        {
          userId: userId,
          isDeleted: false,
        },
        {
          $set: {
            walletAmount: amountToBeUpdate,
          },
        },
        {
          new: true,
        }
      );

      if (!dataFound) {
        throw new HttpException("Data not found.", HttpStatus.OK);
      }

      // const transactionData = {
      //   walletId: dataFound._id,
      //   userId: dataFound.userId,
      //   transactionType: transactionTypeToUpdate,
      //   debitedAmount:
      //     transactionTypeToUpdate == transactionType.DEBIT
      //       ? amountToBeUpdate
      //       : 0,
      //   creditedAmount:
      //     transactionTypeToUpdate == transactionType.CREDIT
      //       ? amountToBeUpdate
      //       : 0,
      //   transactionId: "",
      //   dateAndTime: currentDate,
      //   isManual: true,
      //   remark: `Refund wallet amount of ${userWallet.walletAmount} has been updated with the amount ${amountToBeUpdate} for User ${userFound.mobileNumber}.`,
      //   createdById: "",
      //   createdByType: "",
      // };

      // const createWalletTransaction =
      //   await new this.RefundWalletTransactionsModel({
      //     ...transactionData,
      //   }).save();

      return res.status(200).send({
        message: "Wallet updated Successfully.",
        status: true,
        data: dataFound,
        code: "OK",
        issue: null,
      });
    } catch (err) {
      console.log(err);
      const errData = errorRes(err);
      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
