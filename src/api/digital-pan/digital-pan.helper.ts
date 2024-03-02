import { User, UserDocument } from './../user/entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import axios from 'axios';
import { Extra1, Type } from './entities/digital-pan.entity';

export class DigitalPanHelper {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async religareAuth(userId) {
    const url = process.env.URL;
    const data = {
      Token: process.env.AUTH_TOKEN_RELIGARE,
      RetailerID: userId,
      LogoUrl: process.env.LOGO_URL,
      Copyright: process.env.COPYRIGHT,
      FirmName: process.env.FIRMNAME,
      ServiceId: process.env.SERVICE_ID,
    };

    const axiosRes = await axios.post(url, data);
    return axiosRes.data;
  }

  async getAmount(applicationType, panCardType) {
    let totalAmount = 0;
    if (applicationType == Extra1.A && panCardType == Type.N) {
      totalAmount = parseFloat(process.env.NEWEPAN);
    }
    if (applicationType == Extra1.A && panCardType == Type.Y) {
      totalAmount = parseFloat(process.env.NEWPHYSICAL);
    }
    if (applicationType == Extra1.C && panCardType == Type.Y) {
      totalAmount = parseFloat(process.env.CORRECTIONPHYSICAL);
    }
    if (applicationType == Extra1.C && panCardType == Type.N) {
      totalAmount = parseFloat(process.env.CORRECTIONEPAN);
    }

    return totalAmount;
  }

  async transactionCheck(Token, PancardrefId) {
    let url = process.env.TRANSACTIONSTATUSCHECKURL;
    const data = {
      Token: Token,
      PancardrefId: PancardrefId,
    };

    const axiosRes = await axios.post(url, data);

    return axiosRes;
  }

  async statusCheck(req, Token, PancardrefId) {
    let url;
    if (req.route.path.includes('/pancard-status')) {
      url = process.env.TRANSACTIONSTATUSCHECKURL;
    } else {
      url = process.env.PANCARDSTATUSCHECKURL;
    }

    const data = {
      Token: Token,
      PancardrefId: PancardrefId,
    };

    const axiosRes = await axios.post(url, data);

    const responseData = axiosRes.data; // Extract the response data

    return responseData;
  }

  async getAppliedUser(appliedById) {
    //get current address of user
    let userDetails = await this.userModel.findOne({
      _id: new mongoose.Types.ObjectId(appliedById),
    });
    if (!userDetails) {
      console.log('user not found');
    }

    return userDetails;
  }
}
