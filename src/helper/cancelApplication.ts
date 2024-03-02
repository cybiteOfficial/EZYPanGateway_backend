import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import {
  PanApplication,
  PanDocument,
  status,
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
  PanApplicationFlow,
  PanApplicationFlowDocument,
} from "../api/pan-application-flow/entities/pan-application-flow.entity";
import {
  ItrApplicationFlow,
  ItrApplicationFlowDocument,
} from "../api/itr-application-flow/entities/itr-application-flow.entity";
import {
  GumastaApplicationFlow,
  GumastaApplicationFlowDocument,
} from "../api/gumasta-application-flow/entities/gumasta-application-flow.entity";
import {
  DigitalSignFlow,
  DigitalSignFlowDocument,
} from "../api/digital-sign-flow/entities/digital-sign-flow.entity";
import {
  MsmeApplicationFlow,
  MsmeApplicationFlowDocument,
} from "../api/msme-application-flow/entities/msme-application-flow.entity";
import {
  extractFieldsForPanFlowTable,
  extractFieldsForItrFlowTable,
  extractFieldsForDSCFlowTable,
  extractFieldsForMsmeFlowTable,
  extractFieldsForGumastaFlowTable,
} from "./createNewEntryOfAppInFlow";
import * as moment from "moment";
import { refundWalletAmt } from "../api/refund-wallet/refund-wallet.helper";
import * as fs from "fs";

export class cancelApplication {
  [x: string]: any;
  constructor(
    @InjectModel(PanApplication.name)
    private panAppModel: Model<PanDocument>,
    @InjectModel(ItrApplication.name)
    private itrAppModel: Model<ItrApplicationDocument>,
    @InjectModel(DigitalSign.name)
    private dscAppModel: Model<DigitalSignDocument>,
    @InjectModel(MsmeApplication.name)
    private msmeAppModel: Model<MsmeApplicationDocument>,
    @InjectModel(GumastaApplication.name)
    private gumastaAppModel: Model<GumastaApplicationDocument>,
    @InjectModel(PanApplicationFlow.name)
    private panAppFlowModel: Model<PanApplicationFlowDocument>,
    @InjectModel(ItrApplicationFlow.name)
    private itrAppFlowModel: Model<ItrApplicationFlowDocument>,
    @InjectModel(DigitalSignFlow.name)
    private dscAppFlowModel: Model<DigitalSignFlowDocument>,
    @InjectModel(MsmeApplicationFlow.name)
    private msmeAppFlowModel: Model<MsmeApplicationFlowDocument>,
    @InjectModel(GumastaApplicationFlow.name)
    private gumastaAppFlowModel: Model<GumastaApplicationFlowDocument>,
    private readonly refundwalletAmt: refundWalletAmt
  ) {}

  async findApplication(applicationId, applicationType, req) {
    let applicationFound;
    let resToSend = { message: "", data: null, status: false };

    const query = {
      $and: [
        { _id: new mongoose.Types.ObjectId(applicationId) },
        { appliedById: req.userData.Id },
        { status: status.REJECT },
        { isDeleted: false },
        // {
        //   $or: [
        //     {
        //       appliedAsType: req.userData.type,
        //       appliedByType: req.userData.type,
        //     },
        //   ],
        // },
      ],
    };

    if (applicationType == serviceType.PAN) {
      applicationFound = await this.panAppModel.findOne({
        ...query,
      });
    }

    if (applicationType == serviceType.ITR) {
      applicationFound = await this.itrAppModel.findOne({
        ...query,
      });
    }

    if (applicationType == serviceType.DSC) {
      applicationFound = await this.dscAppModel.findOne({
        ...query,
      });
    }

    if (applicationType == serviceType.MSME) {
      applicationFound = await this.msmeAppModel.findOne({
        ...query,
      });
    }

    if (applicationType == serviceType.GUMASTA) {
      applicationFound = await this.gumastaAppModel.findOne({
        ...query,
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

  async updateApplication(applicationFound, applicationType, deletedFile, req) {
    let updateApplication;
    let resToSend = { message: "", data: null, status: false };

    const dataKeyToUpdate = {
      ...deletedFile,
      status: status.CANCELLED,
      cancelledById: req.userData.Id,
      cancelledByName: req.userData.userName,
      cancelledOnDate: moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss"),
    };

    if (applicationType == serviceType.PAN) {
      updateApplication = await this.panAppModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(applicationFound._id) },
        {
          $set: {
            ...dataKeyToUpdate,
          },
        },
        { new: true }
      );
    }

    if (applicationType == serviceType.ITR) {
      updateApplication = await this.itrAppModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(applicationFound._id) },
        {
          $set: {
            ...dataKeyToUpdate,
          },
        },
        { new: true }
      );
    }

    if (applicationType == serviceType.DSC) {
      updateApplication = await this.dscAppModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(applicationFound._id) },
        {
          $set: {
            ...dataKeyToUpdate,
          },
        },
        { new: true }
      );
    }

    if (applicationType == serviceType.MSME) {
      updateApplication = await this.msmeAppModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(applicationFound._id) },
        {
          $set: {
            ...dataKeyToUpdate,
          },
        },
        { new: true }
      );
    }

    if (applicationType == serviceType.GUMASTA) {
      updateApplication = await this.gumastaAppModel.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(applicationFound._id) },
        {
          $set: {
            ...dataKeyToUpdate,
          },
        },
        { new: true }
      );
    }

    if (!updateApplication) {
      resToSend = {
        message: "Unable to update application.",
        status: false,
        data: null,
      };
    } else {
      resToSend = {
        message: "Application updated successfully.",
        status: true,
        data: updateApplication,
      };
    }
    return resToSend;
  }

  async updateApplicationFlow(updateApplication, applicationType) {
    let updateApplicationFlow;

    if (applicationType == serviceType.PAN) {
      const panadd = await extractFieldsForPanFlowTable(updateApplication);
      updateApplicationFlow = await new this.panAppFlowModel({
        panApplicationId: updateApplication._id,
        ...panadd,
      }).save();
    }

    if (applicationType == serviceType.ITR) {
      const itradd = await extractFieldsForItrFlowTable(updateApplication);
      updateApplicationFlow = await new this.itrAppFlowModel({
        itrApplicationId: updateApplication._id,
        ...itradd,
      }).save();
    }

    if (applicationType == serviceType.DSC) {
      const dscAdded = await extractFieldsForDSCFlowTable(updateApplication);
      updateApplicationFlow = await new this.dscAppFlowModel({
        digitalSignId: updateApplication._id,
        ...dscAdded,
      }).save();
    }

    if (applicationType == serviceType.MSME) {
      const msmeAdd = await extractFieldsForMsmeFlowTable(updateApplication);
      updateApplicationFlow = await new this.msmeAppFlowModel({
        msmeApplicationId: updateApplication._id,
        ...msmeAdd,
      }).save();
    }

    if (applicationType == serviceType.GUMASTA) {
      const gumastaAdd = await extractFieldsForGumastaFlowTable(
        updateApplication
      );
      updateApplicationFlow = await new this.gumastaAppFlowModel({
        gumastaApplicationId: updateApplication._id,
        ...gumastaAdd,
      }).save();
    }

    if (!updateApplicationFlow) {
      return true;
    } else {
      return false;
    }
  }

  async refundAmount(
    applicationTotalPrice,
    refundUsed,
    rewardUsed,
    applicationType,
    applicationId,
    req,
    uniqueTransactionId
  ) {
    const addRefundAmount = await this.refundwalletAmt.addRefundAmount(
      req,
      applicationTotalPrice,
      refundUsed,
      rewardUsed,
      applicationType,
      applicationId,
      req.userData.Id,
      req.userData.type,
      uniqueTransactionId
    );

    if (addRefundAmount) {
      return true;
    } else {
      return false;
    }
  }

  async createObjectOfFileUrl(applicationFound, applicationType) {
    let dataToInsert = {};

    const other =
      applicationFound.otherDocuments.length > 0
        ? applicationFound.otherDocuments.map((document) => ({
            ...document,
            imageUrl: "",
          }))
        : [];

    if (applicationType == serviceType.PAN) {
      dataToInsert = {
        passportPhotoUrl: applicationFound.passportPhotoUrl,
        signaturePhotoUrl: applicationFound.signaturePhotoUrl,
        panFormFrontPhotoUrl: applicationFound.panFormFrontPhotoUrl,
        panFormBackPhotoUrl: applicationFound.panFormBackPhotoUrl,
        adhaarFrontPhotoUrl: applicationFound.adhaarFrontPhotoUrl,
        adhaarBackPhotoUrl: applicationFound.adhaarBackPhotoUrl,
        panCardFront: applicationFound.panCardFront,
        otherDocuments: other,
      };
    }

    if (applicationType == serviceType.ITR) {
      dataToInsert = {
        adhaarFrontPhotoUrl: applicationFound.adhaarFrontPhotoUrl,
        adhaarBackPhotoUrl: applicationFound.adhaarBackPhotoUrl,
        panCardPhotoUrl: applicationFound.panCardPhotoUrl,
        banPassbookPhotoUrl: applicationFound.banPassbookPhotoUrl,
        otherDocuments: other,
      };
    }

    if (applicationType == serviceType.DSC) {
      dataToInsert = {
        photoUrl: applicationFound.photoUrl,
        adhaarCardPhotoUrl: applicationFound.adhaarCardPhotoUrl,
        panCardPhotoUrl: applicationFound.panCardPhotoUrl,
        otherDocuments: other,
      };
    }

    if (applicationType == serviceType.MSME) {
      dataToInsert = {
        photoUrl: applicationFound.photoUrl,
        adhaarCardPhotoUrl: applicationFound.adhaarCardPhotoUrl,
        panCardPhotoUrl: applicationFound.panCardPhotoUrl,
        otherDocuments: other,
      };
    }

    if (applicationType == serviceType.GUMASTA) {
      dataToInsert = {
        propritorPhotoUrl: applicationFound.propritorPhotoUrl,
        adhaarPhotoUrl: applicationFound.adhaarPhotoUrl,
        shopOfficePhotoUrl: applicationFound.shopOfficePhotoUrl,
        addressProofPhotoUrl: applicationFound.addressProofPhotoUrl,
        otherDocuments: other,
      };
    }

    return dataToInsert;
  }

  async deleteFile(dataToInsert) {
    const objectKeys = Object.keys(dataToInsert);

    for (const each of objectKeys) {
      const value = dataToInsert[each];

      if (typeof value === "string") {
        if (fs.existsSync(value)) {
          fs.unlinkSync(value);
        }
        dataToInsert[each] = "";
      } else if (Array.isArray(value) && value.length > 0) {
        const updatedOtherDocuments = value.map((document) => ({
          ...document,
          imageUrl: "",
        }));
        dataToInsert[each] = updatedOtherDocuments;
      } else if (Array.isArray(value) && value.length === 0) {
        dataToInsert[each] = [];
      }
    }

    return dataToInsert;
  }

  ////applied all above functions for cancel application
  async updateAllFunctionForCancelApp(applicationId, applicationType, req) {
    const findOneApplication = await this.findApplication(
      applicationId,
      applicationType,
      req
    );

    if (findOneApplication.status === false) {
      return {
        message: findOneApplication.message,
        status: findOneApplication.status,
        data: findOneApplication.data,
      };
    }

    const applicationFound = findOneApplication.data;

    const createObjectOfFileUrl = await this.createObjectOfFileUrl(
      applicationFound,
      applicationType
    );

    const deletedFile = await this.deleteFile(createObjectOfFileUrl);

    const updateApplication = await this.updateApplication(
      applicationFound,
      applicationType,
      deletedFile,
      req
    );

    if (updateApplication.status === false) {
      return {
        message: updateApplication.message,
        status: updateApplication.status,
        data: updateApplication.data,
      };
    }

    const updatedApplication = updateApplication.data;

    const updateFlow = await this.updateApplicationFlow(
      updatedApplication,
      applicationType
    );

    /**add refund amount in wallet */

    const applicationTotalPrice = applicationFound.applicationIndividualPrice;
    const refundUsed = applicationFound.refundWalletAmountApplied;
    const rewardUsed = applicationFound.rewardWalletAmountApplied;

    const addRefund = await this.refundAmount(
      applicationTotalPrice,
      refundUsed,
      rewardUsed,
      applicationType,
      applicationId,
      req,
      applicationFound.uniqueTransactionId
    );

    if (addRefund) {
      return {
        message: "Application cancelled successfully.",
        status: true,
        data: null,
      };
    } else {
      return {
        message: "Something went wrong.",
        status: false,
        data: null,
      };
    }
  }
}
