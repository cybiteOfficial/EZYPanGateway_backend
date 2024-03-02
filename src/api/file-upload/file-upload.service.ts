/* eslint-disable prettier/prettier */
import { CreateFileUploadDto } from "./dto/create-file-upload.dto";
import { FileUpload, FileUploadDocument } from "./entities/file-upload.entity";
import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { errorRes } from "../../helper/errorRes";
import * as moment from "moment";
import { AddLogFunction } from "../../helper/addLog";

@Injectable()
export class FileUploadService {
  [x: string]: any;
  constructor(
    @InjectModel(FileUpload.name)
    private FileUploadModel: Model<FileUploadDocument>,
    private readonly addlogFunction: AddLogFunction
  ) {}
  //-------------------------------------------------------------------------
  /***
   * upload image
   */
  //-------------------------------------------------------------------------

  async ImageUpload(
    req: any,
    CreateFileUploadDto: CreateFileUploadDto,
    file: Express.Multer.File,
    res: any
  ) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      if (file !== undefined || file !== null) {
        const path_array = file.path.split("public");
        file.path = `${process.env.LOCAL}public${
          path_array[path_array.length - 1]
        }`;
        const imagePath = file.path;
        const result = await new this.FileUploadModel({
          ...CreateFileUploadDto,
          image: imagePath,
        }).save();

        if (!result) {
          throw new HttpException("Unable to add.", HttpStatus.OK);
        }

        this.addlogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "FILE_UPLOAD",
          "IMAGE_UPLOAD",
          result._id,
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          } uploaded image at ${currentDate}.`,
          "Image uploaded successfully.",
          req.socket.remoteAddress
        );

        return res.status(200).send({
          message: "Image uploaded successfully.",
          status: true,
          data: result,
        });
      } else {
        throw new HttpException("Image not found.", HttpStatus.OK);
      }
    } catch (err) {
      const errData = errorRes(err);
      this.addlogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "FILE_UPLOAD",
        "IMAGE_UPLOAD",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to upload image with this credentials at ${moment()
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
   * upload pdf
   */
  //-------------------------------------------------------------------------

  async FileUpload(
    req: any,
    CreateFileUploadDto: CreateFileUploadDto,
    file: Express.Multer.File,
    res: any
  ) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      if (file !== undefined || file !== null) {
        const path_array = file.path.split("public");
        file.path = `${process.env.LOCAL}public${
          path_array[path_array.length - 1]
        }`;
        const imagePath = file.path;

        const result = await new this.FileUploadModel({
          ...CreateFileUploadDto,
          image: imagePath,
        }).save();

        if (!result) {
          throw new HttpException("Unable to add.", HttpStatus.OK);
        }

        this.addlogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "FILE_UPLOAD",
          "FILE_UPLOAD",
          result._id,
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          } uploaded file at ${currentDate}.`,
          "File uploaded successfully.",
          req.socket.remoteAddress
        );

        return res.status(200).send({
          message: "File uploaded successfully.",
          status: true,
          data: result,
        });
      } else {
        throw new HttpException("File not found.", HttpStatus.OK);
      }
    } catch (err) {
      const errData = errorRes(err);
      this.addlogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "FILE_UPLOAD",
        "FILE_UPLOAD",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to upload file with this credentials at ${moment()
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
   * upload both image and pdf
   */
  //-------------------------------------------------------------------------

  async docUpload(req: any, file: Express.Multer.File, res: any) {
    try {
      const requestedId = req.userData?.Id || "";
      const requestedType = req.userData?.type || "";
      const currentDate = moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm:ss");

      if (file !== undefined || file !== null) {
        const path_array = file.path.split("public");
        file.path = `${process.env.LOCAL}public${
          path_array[path_array.length - 1]
        }`;
        const imagePath = file.path;

        const result = await new this.FileUploadModel({
          ...req.body,
          image: imagePath,
        }).save();

        if (!result) {
          throw new HttpException("Unable to add document.", HttpStatus.OK);
        }

        this.addlogFunction.logAdd(
          req,
          requestedType,
          requestedId,
          "FILE_UPLOAD",
          "FILE_UPLOAD",
          result._id,
          true,
          200,
          `${requestedType} ${
            req.userData?.contactNumber || ""
          } uploaded file at ${currentDate}.`,
          "File uploaded successfully.",
          req.socket.remoteAddress
        );

        return res.status(200).send({
          message: "File uploaded successfully.",
          status: true,
          data: result,
        });
      } else {
        throw new HttpException("File not found.", HttpStatus.OK);
      }
    } catch (err) {
      const errData = errorRes(err);
      this.addlogFunction.logAdd(
        req,
        req.userData?.type || "",
        req.userData?.Id || "",
        "FILE_UPLOAD",
        "FILE_UPLOAD",
        "",
        errData.resData.status,
        errData.statusCode,
        `${req.userData?.type || ""} ${
          req.userData?.contactNumber || ""
        } tried to upload file with this credentials at ${moment()
          .utcOffset("+05:30")
          .format("YYYY-MM-DD HH:mm:ss")}.`,
        errData.resData.message,
        req.socket.remoteAddress
      );

      return res.status(errData.statusCode).send({ ...errData.resData });
    }
  }
}
