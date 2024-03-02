import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import Redis from "ioredis";
import * as cors from "cors";
//import * as compression from 'compression';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, { cors: true });
    app.use(cors());

    const redisClient = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
    });

    redisClient.on("connect", () => {
      console.log("Redis client connected");
    });

    app.use((req, res, next) => {
      req.redisClient = redisClient;
      next();
    });
//Code
    // Uncomment the following line if you have the 'compression' middleware
    // app.use(compression());

    await app.listen(process.env.PORT);

    console.log(`Server is running on port ${process.env.PORT}`);
  } catch (error) {
    console.error("Error during bootstrap:", error);
  }
}

bootstrap();
