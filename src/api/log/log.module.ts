import { Module } from "@nestjs/common";
import { LosCronService } from "./log.cronjob";
import { MongooseModule } from "@nestjs/mongoose";
import { Log, LogSchema } from "./entities/log.entity";

@Module({
  imports: [MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }])],
  controllers: [],
  providers: [LosCronService],
})
export class LogModule {}
