import { Injectable } from "@nestjs/common";

import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { Cron } from "@nestjs/schedule";
import { Log, LogDocument } from "./entities/log.entity";

@Injectable()
export class LosCronService {
  [x: string]: any;
  constructor(
    @InjectModel(Log.name)
    private readonly LogModel: Model<LogDocument>
  ) {}

  //-------------------------------------------------------------------------
  /***
   * delete logs
   */
  //-------------------------------------------------------------------------
  //   @Cron("*/1 * * * *") // Runs every   minute

  @Cron("0 * * * *") //runs every hour
  async deleteLogs() {
    try {
      console.log("cron is running for deleting logs...");
      const sixHoursAgo = new Date();
      sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);
      // collection.deleteMany({ createdAt: { $lt: sixHoursAgo } }
      let logs = await this.LogModel.deleteMany({
        createdAt: { $lt: sixHoursAgo },
      });
      if (!logs) {
        console.log("logs not deleted");
      }
    } catch (err) {
      console.log(err);
    }
  }
}
