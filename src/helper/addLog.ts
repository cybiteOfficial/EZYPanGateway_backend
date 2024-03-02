import { InjectModel } from "@nestjs/mongoose";
import { Model, Mongoose } from "mongoose";
import { Log, LogDocument } from "../api/log/entities/log.entity";

/**
 * TODO: log data
 * log data to be sent into function
 * userType( to find user)
 * userId( to find user)
 * request( for requested data)
 * module( To find module)
 * response status( true/false)
 * status code( code eg. 200(OK))
 * remark (to understand type of request)
 * message (response message sent)
 */

export class AddLogFunction {
  [x: string]: any;
  constructor(@InjectModel(Log.name) private logModel: Model<LogDocument>) {}

  async logAdd(
    req,
    userType,
    userId,
    module,
    module_action,
    module_id,
    resStatus,
    statusCode,
    remark,
    message,
    requestedIp
  ) {
    // const logData = {
    //   userType: userType,
    //   userId: userId,
    //   module: module,
    //   module_action: module_action,
    //   module_id: module_id,
    //   resStatus: resStatus,
    //   statusCode: statusCode,
    //   remark: remark,
    //   message: message,
    //   requestedIp: requestedIp,
    // };

    // const addLog = await new this.logModel({
    //   ...logData,
    // }).save();

    return true;
  }
}
