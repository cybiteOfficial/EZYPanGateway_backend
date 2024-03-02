import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, Mongoose } from "mongoose";
import {
  rewardFor,
  RewardHistory,
  RewardHistoryDocument,
} from "../api/rewardHistory/entities/rewardHistory.entity";
import {
  userAndServiceWiseRewardConfig,
  userAndServiceWiseRewardConfigDocument,
} from "../api/userAndServiceWiseRewardConfig/entities/userAndServiceWiseRewardConfig.entity";
import {
  PanApplication,
  PanDocument,
} from "../api/panapplications/entities/pan.entity";
import {
  ItrApplication,
  ItrApplicationDocument,
} from "../api/itr-application/entities/itr-application.entity";
import {
  DigitalSign,
  DigitalSignDocument,
} from "../api/digital-sign/entities/digital-sign.entity";
import {
  GumastaApplication,
  GumastaApplicationDocument,
} from "../api/gumasta-application/entities/gumasta-application.entity";
import {
  MsmeApplication,
  MsmeApplicationDocument,
} from "../api/msme-application/entities/msme-application.entity";
import { serviceType } from "../api/price-config/entities/price-config.entity";
import {
  RefundWalletTransactions,
  transactionType,
} from "../api/refund-wallet-transaction/entities/refund-wallet-transaction.entity";
import { Role, User, UserDocument } from "../api/user/entities/user.entity";
import * as moment from "moment";
import {
  Commission,
  CommissionDocument,
} from "../api/commission/entities/commission.entity";
import {
  UserCommission,
  UserCommissionDocument,
} from "../api/userCommission/entities/user-commission.entity";
import { categoryCode } from "../api/itr-category/entities/itr-category.entity";
import { PanCategory } from "../api/pan-category/entities/pan-category.entity";
import {
  RewardValueConfig,
  RewardValueConfigDocument,
} from "../api/rewardValueConfig/entities/rewardValueConfig.entity";
import {
  UserRewardWallet,
  UserRewardWalletDocument,
} from "../api/userRewardWallet/entities/userRewardWallet.entity";
import {
  RefundWallet,
  RefundWalletDocument,
} from "../api/refund-wallet/entities/refund-wallet.entity";
import { paymentStatus } from "src/api/transaction/entities/transaction.entity";
import {
  CategoryDsaConfig,
  CategoryDsaConfigDocument,
} from "src/api/category-dsa-config/entities/category-dsa-config.entity";
import {
  CategoryPcoConfig,
  CategoryPcoConfigDocument,
} from "src/api/category-pco-config/entities/category-pco-config.entity";
import { status } from "src/api/user-flow/entities/user-flow.entity";

export class postApplication {
  [x: string]: any;
  constructor(
    @InjectModel(UserCommission.name)
    private userCommissionModel: Model<UserCommissionDocument>,
    @InjectModel(RewardHistory.name)
    private userRewardHistory: Model<RewardHistoryDocument>,
    @InjectModel(userAndServiceWiseRewardConfig.name)
    private rewardModel: Model<userAndServiceWiseRewardConfigDocument>,
    @InjectModel(PanCategory.name)
    private panCategoryModel: Model<PanCategory>,
    @InjectModel(PanApplication.name)
    private panAppModel: Model<PanDocument>,
    @InjectModel(ItrApplication.name)
    private itrAppModel: Model<ItrApplicationDocument>,
    @InjectModel(DigitalSign.name)
    private dscAppModel: Model<DigitalSignDocument>,
    @InjectModel(MsmeApplication.name)
    private msmeAppModel: Model<MsmeApplicationDocument>,
    @InjectModel(Commission.name)
    private commissionModel: Model<CommissionDocument>,
    @InjectModel(GumastaApplication.name)
    private gumastaAppModel: Model<GumastaApplicationDocument>,
    @InjectModel(RewardValueConfig.name)
    private RewardValueConfigModel: Model<RewardValueConfigDocument>,
    @InjectModel(UserRewardWallet.name)
    private UserRewardWalletModel: Model<UserRewardWalletDocument>,
    @InjectModel(RefundWallet.name)
    private RefundWalletModel: Model<RefundWalletDocument>,
    @InjectModel(RefundWalletTransactions.name)
    private RefundWalletTransactionsModel: Model<RefundWalletTransactions>,
    @InjectModel(User.name)
    private UserModel: Model<UserDocument>,
    @InjectModel(CategoryDsaConfig.name)
    private CategoryDsaConfigModel: Model<CategoryDsaConfigDocument>,
    @InjectModel(CategoryPcoConfig.name)
    private CategoryPcoConfigModel: Model<CategoryPcoConfigDocument>
  ) {}

  async rewardPointAdded(req, user, applicationFound, applicationType) {
    const rewardPointFound = await this.rewardModel.findOne({
      serviceName: applicationType,
    });

    // Check if the reward for distributor is greater than 0
    const rewardForDistributor = rewardPointFound.rewardForDistributor;
    const isRewardForDistributorValid = rewardForDistributor > 0;

    // Check if the reward for retailer is greater than 0
    const rewardForRetailer = rewardPointFound.rewardForRetailer;
    const isRewardForRetailerValid = rewardForRetailer > 0;

    // Check if the reward for Guest is greater than 0
    const rewardForGuest = rewardPointFound.rewardForGuest;
    const isRewardForGuestValid = rewardForGuest > 0;

    const rewardValueConfigFound = await this.RewardValueConfigModel.find();
    const rewardValue = rewardValueConfigFound[0].perRupeeRewardValue;

    /**reward for guest***/

    if (applicationFound.appliedAsType == Role.GUEST && isRewardForGuestValid) {
      const dataToInsert = {
        userId: applicationFound.appliedById,
        points: rewardForGuest,
        rewardPointValue: rewardValue,
        applicationType: applicationType,
        applicationId: applicationFound._id,
        uniqueTransactionId: applicationFound.uniqueTransactionId,
        srn: applicationFound.srn,
        sjbtCode: "",
        mobileNumber: user.mobileNumber,
        rewardFor: rewardFor.APPLICATIONVERIFIED,
        rewardTransactionType: transactionType.CREDIT,
        logs: `${applicationFound.appliedAsType} ${applicationFound.appliedByNumber} get ${rewardPointFound.rewardForGuest} reward point to their account.`,
      };
      const addUserReward = await new this.userRewardHistory({
        ...dataToInsert,
      }).save();

      const updateRewardWalletOfGuest =
        await this.UserRewardWalletModel.findOneAndUpdate(
          { userId: applicationFound.appliedById },
          {
            $inc: {
              totalReward: rewardForGuest * rewardValue,
            },
          },
          { new: true }
        );

      return true;
    }

    if (
      applicationFound.appliedAsType == Role.DISTRIBUTOR &&
      isRewardForDistributorValid
    ) {
      const dataToInsert = [
        {
          userId: applicationFound.appliedById,
          points: rewardForDistributor,
          rewardPointValue: rewardValue,
          applicationType: applicationType,
          applicationId: applicationFound._id,
          uniqueTransactionId: applicationFound.uniqueTransactionId,
          srn: applicationFound.srn,
          sjbtCode: applicationFound.distributorCode,
          mobileNumber: user.mobileNumber,
          rewardFor: rewardFor.APPLICATIONVERIFIED,
          rewardTransactionType: transactionType.CREDIT,
          logs: `Distributor ${applicationFound.appliedByName} get ${rewardPointFound.rewardForDistributor} reward point to their account.`,
        },
      ];

      const addUserReward = await this.userRewardHistory.insertMany(
        dataToInsert
      );

      const updateRewardWalletOfDistributor =
        await this.UserRewardWalletModel.findOneAndUpdate(
          { userId: applicationFound.appliedById },
          {
            $inc: {
              totalReward: rewardForDistributor * rewardValue,
            },
          },
          { new: true }
        );

      return true;
    }
    if (
      applicationFound.appliedAsType === Role.RETAILER &&
      isRewardForDistributorValid &&
      isRewardForRetailerValid
    ) {
      const dataToInsert = [
        {
          userId: applicationFound.appliedById,
          points: rewardForRetailer,
          rewardPointValue: rewardValue,
          applicationType: applicationType,
          applicationId: applicationFound._id,
          uniqueTransactionId: applicationFound.uniqueTransactionId,
          srn: applicationFound.srn,
          sjbtCode: applicationFound.distributorCode,
          mobileNumber: user.mobileNumber,
          rewardFor: rewardFor.APPLICATIONVERIFIED,
          rewardTransactionType: transactionType.CREDIT,
          logs: `${applicationFound.appliedAsType} ${applicationFound.appliedByName} get ${rewardPointFound.rewardForRetailer} reward point to their account.`,
        },
        {
          userId: applicationFound.distributorId,
          points: rewardForDistributor,
          rewardPointValue: rewardValue,
          applicationType: applicationType,
          applicationId: applicationFound._id,
          uniqueTransactionId: applicationFound.uniqueTransactionId,
          srn: applicationFound.srn,
          rewardFor: rewardFor.APPLICATIONVERIFIED,
          sjbtCode: applicationFound.distributorCode,
          mobileNumber: user.mobileNumber,
          rewardTransactionType: transactionType.CREDIT,
          logs: `DISTRIBUTOR ${applicationFound.distributorCode} get ${rewardPointFound.rewardForDistributor} reward point to their account.`,
        },
      ];

      const addUserReward = await this.userRewardHistory.insertMany(
        dataToInsert
      );

      const updateRewardWalletOfDistributor =
        await this.UserRewardWalletModel.findOneAndUpdate(
          { userId: applicationFound.distributorId },
          {
            $inc: {
              totalReward: rewardForDistributor * rewardValue,
            },
          },
          { new: true }
        );

      const updateRewardWalletOfRetailer =
        await this.UserRewardWalletModel.findOneAndUpdate(
          { userId: applicationFound.appliedById },
          {
            $inc: {
              totalReward: rewardForRetailer * rewardValue,
            },
          },
          { new: true }
        );

      return true;
    } else {
      return false;
    }
  }

  //function to add commission for distributor after application verify
  async commissionAddedForDistributor(
    applicationData,
    paymentCategory,
    sjbtCode,
    applicationType,
    appliedAsType,
    distributorId,
    appliedByuser,
    // appliedById,
    applicationId,
    srn,
    appliedByName
  ) {
    let applicationFound;
    // const startOfMonth = new Date();
    // startOfMonth.setDate(1);
    // startOfMonth.setHours(0, 0, 0, 0);

    // const endOfMonth = new Date();
    // endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    // endOfMonth.setDate(0);
    // endOfMonth.setHours(23, 59, 59, 999);

    const startOfMonth = moment().startOf("month");
    const endOfMonth = moment().endOf("month");

    /***application applied for the category */
    let applicationAppliedForCategory;

    const formatDate = (date) => date.format("YYYY-MM-DD HH:mm:ss");

    const query = {
      // appliedAsType: Role.DISTRIBUTOR,
      distributorCode: sjbtCode,
      // status: "VERIFY",
      // verifiedOnDate: {
      //   $gte: "2024-01-01 00:00:00",
      //   $lt: "2024-02-01 00:00:00",
      // },
      verifiedOnDate: {
        $gte: formatDate(startOfMonth),
        $lte: formatDate(endOfMonth),
      },

      // createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    };

    if (
      paymentCategory.includes(categoryCode.DSA) ||
      applicationData.baseCatAppied === categoryCode.DSA
    ) {
      applicationAppliedForCategory = categoryCode.DSA;
      query["$or"] = [
        { paymentCategory: { $in: [categoryCode.DSA] } },
        { baseCatAppied: categoryCode.DSA },
      ];
    }
    if (
      paymentCategory.includes(categoryCode.PCO) ||
      applicationData.baseCatAppied === categoryCode.PCO
    ) {
      applicationAppliedForCategory = categoryCode.PCO;
      query["$or"] = [
        { paymentCategory: { $in: [categoryCode.PCO] } },
        { baseCatAppied: categoryCode.PCO },
      ];
    }

    if (applicationType == serviceType.ITR) {
      applicationFound = await this.itrAppModel.find({
        ...query,
      });
    }

    if (applicationType == serviceType.DSC) {
      applicationFound = await this.dscAppModel.find({
        ...query,
      });
    }

    if (applicationType == serviceType.MSME) {
      applicationFound = await this.msmeAppModel.find({
        ...query,
      });
    }

    if (applicationType == serviceType.GUMASTA) {
      applicationFound = await this.gumastaAppModel.find({
        ...query,
      });
    }

    const dataToInsert = {
      appliedById: distributorId,
      // appliedByName: appliedByName,
      appliedByType: Role.DISTRIBUTOR,
      applicationType: applicationType,
      applicationId: applicationId,
      commissionFor: Role.DISTRIBUTOR,
      commissionTransactionType: transactionType.CREDIT,
      srn: srn,
      sjbtCode: sjbtCode,
    };

    const panCategories = await this.panCategoryModel.find();
    //get category code of pancategories
    const Categoryname = panCategories.map((category) => category.categoryCode);

    if (applicationType == serviceType.PAN) {
      //if appliction payment is without categories
      if (
        !paymentCategory.includes(categoryCode.DSA) &&
        applicationData.baseCatAppied !== categoryCode.DSA &&
        applicationData.baseCatAppied !== categoryCode.PCO &&
        !paymentCategory.includes(categoryCode.PCO)
      ) {
        const commissionForDistributor = await this.commissionModel.findOne({
          serviceName: serviceType.PAN,
          commissionName: serviceType.PAN,
        });
        const withoutCategoriesCommissionForDistributor =
          commissionForDistributor.commissionForDistributor;

        /*
         * fixed commission for applicaion without pan categories
         */
        const addLedger = await this.userCommissionModel.create({
          ...dataToInsert,
          amount: withoutCategoriesCommissionForDistributor,
          logs: `DISTRIBUTOR ${appliedByName} recieved ${withoutCategoriesCommissionForDistributor} INR commission to their account for application with SRN ${srn}.`,
        });
      } else {
        /*
         *if appliction is Withcategories
         */

        applicationFound = await this.panAppModel.find({
          ...query,
          // paymentCategory: { $exists: true, $not: { $size: 0 } },
        });

        applicationFound = applicationFound.length;

        /*
         *check application count and get commission for distributor
         */
        const commissionForDistributorWithCat =
          await this.commissionForPanCategories(
            applicationAppliedForCategory,
            serviceType.PAN,
            applicationFound
          );

        //add into ledger
        if (commissionForDistributorWithCat !== 0) {
          const addLedger = await new this.userCommissionModel({
            ...dataToInsert,
            amount: commissionForDistributorWithCat,
            logs: `DISTRIBUTOR ${appliedByName} recieved ${commissionForDistributorWithCat} INR commission to their account for application with SRN ${srn}.`,
          }).save();
        } else {
          return true;
        }
      }
    }

    //fixed commission for other applications(excluding pan-applicaiton)
    if (applicationFound && applicationType !== serviceType.PAN) {
      //get commission for distributor
      const commissionData = await this.commissionModel.findOne({
        serviceName: applicationType,
      });
      //add into ledger
      const amount = commissionData.commissionForDistributor;
      if (amount > 0) {
        const addLedger = await this.userCommissionModel.create({
          ...dataToInsert,
          amount: commissionData.commissionForDistributor,
          logs: `DISTRIBUTOR ${appliedByName} recieved ${commissionData.commissionForDistributor} INR commission to their account for application with SRN ${srn}.`,
        });
      } else {
        return true;
      }
    }

    return applicationFound;
  }

  /**
   * function to get commission for distributon for applicaions with pancategories.
   */
  async commissionForPanCategories(
    applicationAppliedForCategory,
    applicationType,
    applicationCount
  ) {
    let commissionForDistributor = 0;

    let getCommisionForDistributor = [];
    if (applicationAppliedForCategory == categoryCode.DSA)
      getCommisionForDistributor = await this.CategoryDsaConfigModel.aggregate([
        {
          $match: {
            serviceName: applicationType,
            minimumApplications: { $lte: applicationCount },
          },
        },
        {
          $sort: { minimumApplications: -1 },
        },
        {
          $limit: 1,
        },
        {
          $project: {
            _id: 0,
            commissionForDistributor: 1,
          },
        },
      ]);
    if (applicationAppliedForCategory == categoryCode.PCO)
      getCommisionForDistributor = await this.CategoryPcoConfigModel.aggregate([
        {
          $match: {
            serviceName: applicationType,
            minimumApplications: { $lte: applicationCount },
          },
        },
        {
          $sort: { minimumApplications: -1 },
        },
        {
          $limit: 1,
        },
        {
          $project: {
            _id: 0,
            commissionForDistributor: 1,
          },
        },
      ]);

    if (getCommisionForDistributor.length) {
      commissionForDistributor =
        getCommisionForDistributor[0].commissionForDistributor;
    } else {
      commissionForDistributor = 0;
    }

    // const findPanRangeData = await this.commissionModel.aggregate([
    //   { $match: { serviceName: applicationType } },
    //   { $match: { commissionName: { $ne: serviceType.PAN } } },
    //   { $sort: { minimumApplications: 1 } },
    // ]);

    // const rangeLessThanApplicationCount = findPanRangeData
    //   .filter((el) => el.minimumApplications <= applicationCount)
    //   .map((el) => el.minimumApplications);

    // if (rangeLessThanApplicationCount.length) {
    //   const minimumApplications = rangeLessThanApplicationCount.slice(-1)[0];
    //   const panCategoryLessThanApplicationCount =
    //     await this.commissionModel.findOne({
    //       serviceName: applicationType,
    //       minimumApplications: minimumApplications,
    //     });

    //   commissionForDistributor =
    //     panCategoryLessThanApplicationCount.commissionForDistributor;
    // } else {
    //   commissionForDistributor = 0;
    // }

    return commissionForDistributor;
  }

  async checkApplication(applicationId, applicationType, req) {
    let applicationFound;

    if (applicationType == serviceType.PAN) {
      applicationFound = await this.panAppModel.findOne({
        _id: applicationId,
      });
    }

    if (applicationType == serviceType.ITR) {
      applicationFound = await this.itrAppModel.findOne({
        _id: applicationId,
      });
    }

    if (applicationType == serviceType.DSC) {
      applicationFound = await this.dscAppModel.findOne({
        _id: applicationId,
      });
    }

    if (applicationType == serviceType.MSME) {
      applicationFound = await this.msmeAppModel.findOne({
        _id: applicationId,
      });
    }

    if (applicationType == serviceType.GUMASTA) {
      applicationFound = await this.gumastaAppModel.findOne({
        _id: applicationId,
      });
    }
    let user = await this.UserModel.findOne({
      sjbtCode: applicationFound.distributorCode,
      isDeleted: false,
    });

    /***get applied by user*/
    let getAppliedUser = await this.UserModel.findOne({
      _id: new mongoose.Types.ObjectId(applicationFound.appliedById),
      isDeleted: false,
    });

    const rewardFunctionApplied = this.rewardPointAdded(
      req,
      getAppliedUser,
      applicationFound,
      applicationType
    );

    if (
      user?.userType === Role.DISTRIBUTOR &&
      user?.subscriptionTxnStatus === paymentStatus.SUCCESS
    ) {
      const commissionApplied = await this.commissionAddedForDistributor(
        applicationFound,
        applicationFound.paymentCategory,
        applicationFound.distributorCode,
        applicationType,
        applicationFound.appliedAsType,
        user._id.toString(),
        getAppliedUser,
        applicationFound._id,
        applicationFound.srn,
        user.name
      );
    }

    return true;
  }

  /** function to update refund wallet and create refund transaction */

  async updateRefundWallet(
    refundAmt,
    userId,
    applicationType,
    applicationId,
    userType,
    uniqueTransactionId,
    req,
    srn
  ) {
    const currentDateTime = moment()
      .utcOffset("+05:30")
      .format("YYYY-MM-DD HH:mm:ss");

    const refundWalletFound = await this.RefundWalletModel.findOne({
      userId: userId,
    });

    const refundWallet = await this.RefundWalletModel.findByIdAndUpdate(
      {
        _id: refundWalletFound._id,
      },
      {
        $set: { walletAmount: refundAmt },
      },
      {
        new: true,
      }
    );

    if (refundAmt > 0) {
      const refundWalletTransactionsToBeInsert = {
        walletId: refundWallet._id.toString(),
        userId: userId,
        applicationType: applicationType,
        applicationId: applicationId,
        srn: srn,
        sjbtCode: req.userData.sjbtCode,
        transactionType: transactionType.DEBIT,
        uniqueTransactionId: uniqueTransactionId,
        debitedAmount: refundAmt,
        creditedAmount: 0,
        dateAndTime: currentDateTime,
        createdByType: userType,
        remark: `Refund wallet amount ${refundAmt} debited for application ${applicationType} with SRN ${srn} by user ${req.userData.contactNumber}.`,
        createdById: userId,
      };

      const createRefundTransaction =
        await new this.RefundWalletTransactionsModel({
          ...refundWalletTransactionsToBeInsert,
        }).save();
    }

    return true;
  }

  /** function to update reward wallet and create reward history */

  async updateRewardWallet(
    rewardAmount,
    userId,
    applicationType,
    applicationId,
    srn,
    uniqueTransactionId,
    req
  ) {
    const rewardPointValue = await this.RewardValueConfigModel.find();

    const rewardWalletFound = await this.UserRewardWalletModel.findOne({
      userId: userId,
    });

    const rewardWalletUpdated =
      await this.UserRewardWalletModel.findByIdAndUpdate(
        {
          _id: rewardWalletFound._id,
        },
        {
          $set: {
            totalReward: rewardAmount,
          },
        },
        { new: true }
      );

    if (rewardAmount > 0) {
      const rewardHistoryData = {
        userId: userId,
        points: rewardAmount,
        rewardPointValue: rewardPointValue[0].perRupeeRewardValue,
        applicationType: applicationType,
        applicationId: applicationId,
        uniqueTransactionId: uniqueTransactionId,
        srn: srn,
        sjbtCode: req.userData.sjbtCode,
        retailerId: "",
        rewardFor: rewardFor.APPLICATIONAPPLIED,
        rewardTransactionType: transactionType.DEBIT,
        logs: `DISTRIBUTOR ${req.userData.contactNumber} used  ${rewardAmount} reward point for application ${applicationType} with SRN ${srn}.`,
      };

      const rewardHistory = await new this.userRewardHistory({
        ...rewardHistoryData,
      }).save();
    }

    return true;
  }

  /** function to update refund wallet and create refund transaction */

  async updateRefundWalletForCart(
    paidAmt,
    refundAmt,
    userId,
    applicationType,
    applicationId,
    userType,
    uniqueTransactionId,
    req,
    srn
  ) {
    const currentDateTime = moment()
      .utcOffset("+05:30")
      .format("YYYY-MM-DD HH:mm:ss");

    const refundWalletFound = await this.RefundWalletModel.findOne({
      userId: userId,
    });

    const refundWallet = await this.RefundWalletModel.findByIdAndUpdate(
      {
        _id: refundWalletFound._id,
      },
      {
        $set: { walletAmount: refundAmt + refundWalletFound.freezeAmount },
      },
      {
        new: true,
      }
    );

    if (paidAmt > 0) {
      const refundWalletTransactionsToBeInsert = {
        walletId: refundWallet._id.toString(),
        userId: userId,
        applicationType: applicationType,
        applicationId: applicationId,
        transactionType: transactionType.DEBIT,
        uniqueTransactionId: uniqueTransactionId,
        srn: srn,
        sjbtCode: req.userData.sjbtCode,
        debitedAmount: paidAmt,
        creditedAmount: 0,
        dateAndTime: currentDateTime,
        createdByType: userType,
        remark: `Refund wallet amount ${paidAmt} debited for application ${applicationType} with SRN ${srn} by user ${req.userData.contactNumber}.`,
        createdById: userId,
      };

      const createRefundTransaction =
        await new this.RefundWalletTransactionsModel({
          ...refundWalletTransactionsToBeInsert,
        }).save();
    }

    return true;
  }

  /** function to update reward wallet and create reward history */

  async updateRewardWalletForCart(
    paidAmount,
    rewardAmount,
    userId,
    applicationType,
    applicationId,
    srn,
    uniqueTransactionId,
    req
  ) {
    const rewardPointValue = await this.RewardValueConfigModel.find();

    const rewardWalletFound = await this.UserRewardWalletModel.findOne({
      userId: userId,
    });
    const rewardWalletUpdated =
      await this.UserRewardWalletModel.findByIdAndUpdate(
        {
          _id: rewardWalletFound._id,
        },
        {
          $set: {
            totalReward: rewardAmount,
          },
        },
        { new: true }
      );

    if (paidAmount > 0) {
      const rewardHistoryData = {
        userId: userId,
        points: paidAmount / rewardPointValue[0].perRupeeRewardValue,
        rewardPointValue: rewardPointValue[0].perRupeeRewardValue,
        applicationType: applicationType,
        applicationId: applicationId,
        uniqueTransactionId: uniqueTransactionId,
        srn: srn,
        sjbtCode: req.userData.sjbtCode,
        retailerId: "",
        rewardFor: rewardFor.APPLICATIONAPPLIED,
        rewardTransactionType: transactionType.DEBIT,
        logs: `${req.userData.type} ${req.userData.contactNumber} used  ${
          paidAmount / rewardPointValue[0].perRupeeRewardValue
        } reward point for application ${applicationType} with SRN ${srn}.`,
      };

      const rewardHistory = await new this.userRewardHistory({
        ...rewardHistoryData,
      }).save();
    }

    return true;
  }
}
