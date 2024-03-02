import { InjectModel } from "@nestjs/mongoose";
import { Model, Mongoose } from "mongoose";
import { User, UserDocument } from "../api/user/entities/user.entity";
import {
  RetailerRegisterReward,
  RetailerRegisterRewardDocument,
} from "../api/retailer-register-reward/entities/retailer-register-reward.entity";
import {
  rewardFor,
  RewardHistory,
  RewardHistoryDocument,
} from "../api/rewardHistory/entities/rewardHistory.entity";
import { transactionType } from "../api/refund-wallet-transaction/entities/refund-wallet-transaction.entity";

export class checkRetailersWithDistributorCode {
  constructor(
    @InjectModel(RewardHistory.name)
    private userRewardModel: Model<RewardHistoryDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(RetailerRegisterReward.name)
    private retailerRegisterRewardModel: Model<RetailerRegisterRewardDocument>
  ) {}

  async checkCount(sjbtCode, userId, retailerId, mobileNumber) {
    const checkUser = await this.userModel.find({
      allDistributor: { $elemMatch: { sjbtCode: sjbtCode } },
    });
    const retailerCount = checkUser.length;

    if (retailerCount > 20) {
      const rewardAdded = await this.retailerRegisterRewardModel.find();
      const getRewardPoint = rewardAdded[0].retailerRegisterRewardPoint;

      const addUserReward = await new this.userRewardModel({
        userId: userId,
        points: getRewardPoint,
        rewardFor: rewardFor.RETAILERADDED,
        retailerId: retailerId,
        sjbtCode: sjbtCode,
        mobileNumber: mobileNumber,
        rewardTransactionType: transactionType.CREDIT,
        logs: `DISTRIBUTOR ${sjbtCode} get ${getRewardPoint} reward point to their account at the time of login new ${retailerCount} retailer.`,
      }).save();

      return true;
    } else {
      return false;
    }
  }
}
