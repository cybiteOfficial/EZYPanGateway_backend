/* eslint-disable prefer-const */
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import * as moment from "moment";
import {
  isAadharValid,
  isEmailValid,
  isMinor,
  isMobileValid,
  isPanValid,
  isValidDate,
  isvalidUrl,
} from "../../helper/basicValidation";
import { HttpException, HttpStatus } from "@nestjs/common";
import { applicationTypes, formCategory } from "./entities/pan-cart.entity";
import { keyValidationCheck } from "../../helper/keysValidationCheck";
import {
  paymentCategories,
  urlFields,
} from "../panapplications/entities/pan.entity";
import { Role, User, UserDocument } from "../user/entities/user.entity";
import {
  RefundWallet,
  RefundWalletDocument,
} from "../refund-wallet/entities/refund-wallet.entity";
import {
  UserRewardWallet,
  UserRewardWalletDocument,
} from "../userRewardWallet/entities/userRewardWallet.entity";
import {
  PriceConfig,
  PriceConfigDocument,
  serviceType,
} from "../price-config/entities/price-config.entity";
import {
  PanCategory,
  PanCategoryDocument,
} from "../pan-category/entities/pan-category.entity";
import { errorRes } from "../../helper/errorRes";

export class panCartHelper {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(RefundWallet.name)
    private RefundWalletModel: Model<RefundWalletDocument>,
    @InjectModel(UserRewardWallet.name)
    private UserRewardWalletModel: Model<UserRewardWalletDocument>,
    @InjectModel(PriceConfig.name)
    private PriceConfigModel: Model<PriceConfigDocument>,
    @InjectModel(PanCategory.name)
    private panCategoryModel: Model<PanCategoryDocument>
  ) {}

  async getBasePrice(userType) {
    const basePriceData = await this.PriceConfigModel.findOne({
      serviceType: serviceType.PAN,
    });
    const configBasePrice =
      userType === Role.GUEST
        ? basePriceData.guestBaseprice
        : basePriceData.price;
    const configConvinienceCharges =
      userType === Role.GUEST
        ? basePriceData.guestConvenienceprice
        : basePriceData.convenienceprice;
    return { configBasePrice, configConvinienceCharges };
  }

  // async getAmount(userType: string, categoryArray: []) {
  //   try {
  //     const { configBasePrice, configConvinienceCharges } =
  //       await this.getBasePrice(userType);
  //     if (!categoryArray.length) {
  //       return {
  //         status: true,
  //         data: {
  //           totalAmount: configBasePrice + configConvinienceCharges,
  //           convinienceCharges: configConvinienceCharges,
  //           basePrice: configBasePrice,
  //           baseCatAppied: paymentCategories.BASIC_SERVICE,
  //         },
  //       };
  //     }

  //     const categories = await this.panCategoryModel.find(
  //       { isActive: true, categoryCode: { $in: categoryArray } },
  //       {
  //         price: 1,
  //         categoryCode: 1,
  //       },
  //     );

  //     if (categories.length) {
  //       const catDsa = categories.find((ele) => {
  //         return ele.categoryCode == `${paymentCategories.CAT_DSA}`;
  //       });
  //       const catPco = categories.find((ele) => {
  //         return ele.categoryCode == `${paymentCategories.CAT_PCO}`;
  //       });

  //       const baseCatAppied = catDsa
  //         ? `${paymentCategories.CAT_DSA}`
  //         : catPco
  //         ? `${paymentCategories.CAT_PCO}`
  //         : `${paymentCategories.BASIC_SERVICE}`;
  //       const basePrice =
  //         baseCatAppied === `${paymentCategories.CAT_DSA}`
  //           ? catDsa.price
  //           : baseCatAppied === `${paymentCategories.CAT_PCO}`
  //           ? catPco.price
  //           : configBasePrice;
  //       const convinienceCharges =
  //         baseCatAppied === `${paymentCategories.CAT_DSA}` ||
  //         baseCatAppied === `${paymentCategories.CAT_PCO}`
  //           ? 0
  //           : configConvinienceCharges;

  //       const totalAmount = categories.reduce((acc, ele) => {
  //         if (ele.categoryCode !== baseCatAppied) {
  //           acc += ele.price;
  //         }
  //         return acc;
  //       }, basePrice + convinienceCharges);

  //       return {
  //         status: true,
  //         data: {
  //           totalAmount,
  //           convinienceCharges,
  //           basePrice,
  //           baseCatAppied,
  //         },
  //       };
  //     }
  //   } catch (err) {
  //     return {
  //       status: true,
  //       data: {
  //         totalAmount: 0,
  //         convinienceCharges: 0,
  //         basePrice: 0,
  //         baseCatAppied: '',
  //       },
  //     };
  //   }
  // }

  async getAmount(userType: string, categoryArray: []) {
    try {
      const { configBasePrice, configConvinienceCharges } =
        await this.getBasePrice(userType);
      if (!categoryArray.length) {
        return {
          status: true,
          data: {
            totalAmount: configBasePrice + configConvinienceCharges,
            convinienceCharges: configConvinienceCharges,
            basePrice: configBasePrice,
            baseCatAppied: paymentCategories.BASIC_SERVICE,
          },
        };
      }

      const categories = await this.panCategoryModel.find(
        { isActive: true, categoryCode: { $in: categoryArray } },
        {
          price: 1,
          categoryCode: 1,
        }
      );

      if (categories.length) {
        const catDsa = categories.find((ele) => {
          return ele.categoryCode == `${paymentCategories.CAT_DSA}`;
        });
        const catPco = categories.find((ele) => {
          return ele.categoryCode == `${paymentCategories.CAT_PCO}`;
        });

        const additionalone = categories.find((ele) => {
          return ele.categoryCode == `${paymentCategories.ADDITIONAL_CAT_1}`;
        });
        const additionalsecond = categories.find((ele) => {
          return ele.categoryCode == `${paymentCategories.ADDITIONAL_CAT_2}`;
        });

        let additionalCat2 = 0;
        let additionalCat3 = 0;
        let mainCategoryPrice = 0;
        if (additionalone && additionalone !== undefined) {
          additionalCat2 = additionalone.price;
        }

        if (additionalsecond && additionalsecond !== undefined) {
          additionalCat3 = additionalsecond.price;
        }

        const baseCatAppied = catDsa
          ? `${paymentCategories.CAT_DSA}`
          : catPco
          ? `${paymentCategories.CAT_PCO}`
          : `${paymentCategories.BASIC_SERVICE}`;

        const basePrice =
          baseCatAppied === `${paymentCategories.CAT_DSA}`
            ? catDsa.price
            : baseCatAppied === `${paymentCategories.CAT_PCO}`
            ? catPco.price
            : configBasePrice;
        const convinienceCharges =
          baseCatAppied === `${paymentCategories.CAT_DSA}` ||
          baseCatAppied === `${paymentCategories.CAT_PCO}`
            ? 0
            : configConvinienceCharges;

        mainCategoryPrice = basePrice + convinienceCharges;

        const totalAmount = categories.reduce((acc, ele) => {
          if (ele.categoryCode !== baseCatAppied) {
            acc += ele.price;
          }
          return acc;
        }, basePrice + convinienceCharges);

        return {
          status: true,
          data: {
            totalAmount,
            convinienceCharges,
            mainCategoryPrice,
            additionalCat2,
            additionalCat3,
            basePrice,
            baseCatAppied,
          },
        };
      }
    } catch (err) {
      return {
        status: true,
        data: {
          totalAmount: 0,
          mainCategoryPrice: 0,
          additionalCat2: 0,
          additionalCat3: 0,
          convinienceCharges: 0,
          basePrice: 0,
          baseCatAppied: "",
        },
      };
    }
  }

  async getRefundAmount(userId) {
    try {
      const refundWalletData = await this.RefundWalletModel.findOne({
        userId: userId,
        isDeleted: false,
      });
      if (refundWalletData) {
        return {
          status: true,
          data: {
            refundAmount:
              refundWalletData.walletAmount - refundWalletData.freezeAmount,
          },
        };
      }
      return {
        status: false,
        data: { refundAmount: 0 },
      };
    } catch (err) {
      const errData = errorRes(err);

      return {
        status: false,
        data: { refundAmount: 0 },
      };
    }
  }

  async getRewardAmount(userId: any) {
    try {
      const rewardWalletData: any = await this.UserRewardWalletModel.findOne({
        userId: userId,
        isDeleted: false,
      });
      if (rewardWalletData) {
        return {
          status: true,
          data: { rewardAmount: rewardWalletData.totalReward },
        };
      }
      return {
        status: false,
        data: { rewardAmount: 0 },
      };
    } catch (err) {
      const errData = errorRes(err);

      return {
        status: false,
        data: { rewardAmount: 0 },
      };
    }
  }

  async getAllowedCategories(requestedId, requestedCategory) {
    const getCategories = await this.userModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(requestedId),
          isDeleted: false,
        },
      },
      {
        $project: {
          panCategoryId: "$category.panCategories",
        },
      },
      { $unwind: "$panCategoryId" },
      {
        $lookup: {
          from: "pancategories",
          let: {
            panCategoryId: "$panCategoryId",
          },
          as: "categoryData",
          pipeline: [
            {
              $match: {
                $and: [
                  { $expr: { $eq: ["$_id", "$$panCategoryId"] } },
                  { isActive: true },
                ],
              },
            },
            {
              $project: {
                categoryName: 1,
                applicableForMinor: 1,
                categoryCode: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          categoryName: {
            $arrayElemAt: ["$categoryData.categoryName", 0],
          },
          categoryCode: {
            $arrayElemAt: ["$categoryData.categoryCode", 0],
          },
          applicableForMinor: {
            $arrayElemAt: ["$categoryData.applicableForMinor", 0],
          },
          _id: 0,
        },
      },
      {
        $match: {
          categoryCode: { $in: requestedCategory },
        },
      },
    ]);

    return getCategories;
  }

  async checkApplicableForMinor(getCategories, paymentCategory) {
    const resToSend = {
      status: true,
      message: "",
    };

    const minorCategories = getCategories.reduce((acc, category) => {
      if (
        paymentCategory.includes(category.categoryCode) &&
        !category.applicableForMinor
      ) {
        acc.status = false;
        acc.message += `${category.categoryCode} is not applicable for minor.`;
      }
      return acc;
    }, resToSend);
    return minorCategories;
  }

  async panCartValidations(panCartItems, req, res) {
    try {
      let dataToBeInsert = [];
      for (let eachItem in panCartItems) {
        let {
          category,
          title,
          name,
          dob,
          email,
          parentName,
          parentType,
          adhaarNumber,
          mobileNumber,
          panCardFront,
          passportPhotoUrl,
          signaturePhotoUrl,
          panFormFrontPhotoUrl,
          panFormBackPhotoUrl,
          adhaarFrontPhotoUrl,
          adhaarBackPhotoUrl,
          panNumber,
          acknowledgementNumber,
          comments,
          appliedFrom,
          IsAgreedToTermsAndConditions,
          otherDocuments,
          paymentCategory,
          version,
          applicationType,
        } = panCartItems[eachItem];

        const requestedId = req.userData?.Id || "";
        const requestedType = req.userData?.type || "";
        const currentDate = moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss");

        if (panNumber == "" && !(category === formCategory.INDIVIDUAL)) {
          throw new HttpException(
            `Contact us for this applied category.`,
            HttpStatus.OK
          );
        }

        /**check mobile number is valid or not*/
        if (!isMobileValid(mobileNumber)) {
          throw new HttpException(
            "Mobile number must be a valid number.",
            HttpStatus.OK
          );
        }

        /**check email is valid or not */
        if (email && email !== "") {
          if (!isEmailValid(email)) {
            throw new HttpException("Invalid email Id.", HttpStatus.OK);
          }
        }

        /**check adhar number is valid or not */
        if (adhaarNumber && isAadharValid(adhaarNumber) === false) {
          throw new HttpException(
            "Aadhar number must be valid number.",
            HttpStatus.OK
          );
        }

        /**check pancard front is valid or not */
        if (panCardFront && isvalidUrl(panCardFront) === false) {
          throw new HttpException(
            "PAN card front photo url must be valid url.",
            HttpStatus.OK
          );
        }

        if (passportPhotoUrl && isvalidUrl(passportPhotoUrl) === false) {
          /**check passportPhotoUrl is valid or not */
          throw new HttpException(
            "Passoport photo url must be valid url.",
            HttpStatus.OK
          );
        }

        /**check signaturePhotoUrl is valid or not */
        if (signaturePhotoUrl && isvalidUrl(signaturePhotoUrl) === false) {
          throw new HttpException(
            "Signature photo url must be valid url.",
            HttpStatus.OK
          );
        }

        /**check panFormFrontPhotoUrl is valid or not */
        if (
          panFormFrontPhotoUrl &&
          isvalidUrl(panFormFrontPhotoUrl) === false
        ) {
          throw new HttpException(
            "PAN form front photo url must be valid url.",
            HttpStatus.OK
          );
        }

        /**check panFormBackPhotoUrl is valid or not */
        if (panFormBackPhotoUrl && isvalidUrl(panFormBackPhotoUrl) === false) {
          throw new HttpException(
            "PAN form back photo url must be valid url.",
            HttpStatus.OK
          );
        }

        /**check adhaarFrontPhotoUrl is valid or not */
        if (adhaarFrontPhotoUrl && isvalidUrl(adhaarFrontPhotoUrl) === false) {
          throw new HttpException(
            "Adhaar front photo url must be valid url.",
            HttpStatus.OK
          );
        }

        /**check adhaarBackPhotoUrl is valid or not */
        if (adhaarBackPhotoUrl && isvalidUrl(adhaarBackPhotoUrl) === false) {
          throw new HttpException(
            "Adhaar back photo url must be valid url.",
            HttpStatus.OK
          );
        }

        /**check pannumber is valid or not */
        if (panNumber && isPanValid(panNumber) === false) {
          throw new HttpException(
            "Pan number must be valid number.",
            HttpStatus.OK
          );
        }

        let applicationsType = "";
        if (panNumber === "" || !panNumber) {
          applicationsType = applicationTypes.NEW;
        } else {
          applicationsType = applicationTypes.CORRECTION;
        }

        panCartItems[eachItem]["applicationType"] = applicationsType;

        if (otherDocuments && otherDocuments !== "") {
          otherDocuments = JSON.parse(JSON.stringify(otherDocuments));
          if (!Array.isArray(otherDocuments)) {
            throw new HttpException(
              "Other documents must be array.",
              HttpStatus.OK
            );
          }
          if (otherDocuments.length) {
            for (const each in otherDocuments) {
              if (otherDocuments[each]) {
                const { title, imageUrl } = otherDocuments[each];
                if (title === undefined || title === null || title === "") {
                  throw new HttpException(
                    "title must not be empty.",
                    HttpStatus.OK
                  );
                }
                if (
                  imageUrl === null ||
                  imageUrl === undefined ||
                  !isvalidUrl(imageUrl)
                ) {
                  throw new HttpException(
                    "imageUrl must be valid url.",
                    HttpStatus.OK
                  );
                }
              }
            }
          } else {
            otherDocuments = [];
          }
        }
        /**check dob format is valid or not */
        if (dob && !isValidDate(dob)) {
          throw new HttpException(
            "Date must be in YYYY-MM-DD format.",
            HttpStatus.OK
          );
        }
        if (paymentCategory.length) {
          const getCategories = await this.getAllowedCategories(
            requestedId,
            paymentCategory
          );

          if (
            !getCategories ||
            getCategories.length !== paymentCategory.length
          ) {
            throw new HttpException(
              "Invalid category in request.",
              HttpStatus.OK
            );
          }

          if (isMinor(dob)) {
            const checkMinor = await this.checkApplicableForMinor(
              getCategories,
              paymentCategory
            );
            if (!checkMinor.status) {
              throw new HttpException(checkMinor.message, HttpStatus.OK);
            }
          }
        }
        dataToBeInsert.push(panCartItems[eachItem]);
      }

      return dataToBeInsert;
    } catch (err) {
      const errData = errorRes(err);
      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }

  async getAppliedUser(appliedById) {
    //get current address of user
    let userDetails = await this.userModel.findOne({
      _id: new mongoose.Types.ObjectId(appliedById),
    });
    if (!userDetails) {
      console.log("user not found");
    }
    // let userEmail = userDetails.email;
    return userDetails;
  }
}
