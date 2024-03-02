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

export class reUploadPdf {
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
    private gumastaAppFlowModel: Model<GumastaApplicationFlowDocument>
  ) {}

  async findApplication(applicationId, applicationType) {
    let applicationFound;
    let resToSend = { message: "", data: null, status: false };

    const query = {
      $and: [
        { _id: new mongoose.Types.ObjectId(applicationId) },
        { isDeleted: false },
        {
          $or: [
            {
              status: status.VERIFY,
            },
            {
              status: status.GENERATE,
            },
            {
              status: status.DONE,
            },
          ],
        },
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

  async checkAckNumber(applicationFound, applicationType, req) {
    let ackNumberFound;
    let resToSend = { message: "", data: null, status: false };

    const query = {
      _id: { $ne: new mongoose.Types.ObjectId(applicationFound._id) },
      acknowledgementNumber: req.body.acknowledgementNumber,
    };

    if (applicationType == serviceType.PAN) {
      ackNumberFound = await this.panAppModel.findOne({
        ...query,
      });
      if (ackNumberFound) {
        resToSend = {
          message:
            "Acknowledgement number already exist with another application.",
          status: false,
          data: null,
        };
      } else {
        resToSend = {
          message: "Acknowledgement number not found.",
          status: true,
          data: null,
        };
      }
    }

    if (applicationType == serviceType.ITR) {
      ackNumberFound = await this.itrAppModel.findOne({
        ...query,
      });
    }

    if (applicationType == serviceType.DSC) {
      ackNumberFound = await this.dscAppModel.findOne({
        ...query,
      });
    }

    if (applicationType == serviceType.MSME) {
      ackNumberFound = await this.msmeAppModel.findOne({
        ...query,
      });
    }

    if (applicationType == serviceType.GUMASTA) {
      ackNumberFound = await this.gumastaAppModel.findOne({
        ...query,
      });
    }

    resToSend = {
      message: "All ok.",
      status: true,
      data: null,
    };

    return resToSend;
  }

  async updateApplication(applicationFound, applicationType, req, imagePath) {
    let updateApplication;
    let resToSend = { message: "", data: null, status: false };

    const dataKeyToUpdate = {
      acknowledgementNumber: req.body.acknowledgementNumber,
      acknowledgementPdf: imagePath,
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

  ////applied all above functions for reupload pdf
  async updateAllFunctionForReuploadPdf(
    applicationId,
    applicationType,
    req,
    imagePath
  ) {
    let resToSend = { message: "", data: null, status: false };

    const findOneApplication = await this.findApplication(
      applicationId,
      applicationType
    );

    if (findOneApplication.status === false) {
      return (resToSend = {
        message: findOneApplication.message,
        status: findOneApplication.status,
        data: findOneApplication.data,
      });
    }

    const applicationFound = findOneApplication.data;

    const checkAckNumber = await this.checkAckNumber(
      applicationFound,
      applicationType,
      req
    );

    if (checkAckNumber.status === false) {
      return (resToSend = {
        message: checkAckNumber.message,
        status: checkAckNumber.status,
        data: checkAckNumber.data,
      });
    }

    const updateApplication = await this.updateApplication(
      applicationFound,
      applicationType,
      req,
      imagePath
    );

    if (updateApplication.status === false) {
      return (resToSend = {
        message: updateApplication.message,
        status: updateApplication.status,
        data: updateApplication.data,
      });
    }

    const updatedApplication = updateApplication.data;

    const updateFlow = await this.updateApplicationFlow(
      updatedApplication,
      applicationType
    );

    return (resToSend = {
      message: "Acknowledgement PDF reuploaded successfully.",
      status: true,
      data: null,
    });
  }
}
