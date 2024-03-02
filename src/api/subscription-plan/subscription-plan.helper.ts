import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import * as moment from 'moment';
import { User, UserDocument } from '../user/entities/user.entity';
import { SubscriptionType } from '../subscription-flow/entities/subscription-flow.entity';
import { paymentStatus } from '../transaction/entities/transaction.entity';

export class checkSubscriptionPlan {
  [x: string]: any;
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  /**
   * function to check if user existing subscription plan annual then only allowed for annual and lifetime
   * if lifetime then only allowed for lifetime.
   */

  async checkSubscriptionPlan(userId, requestedPlanType) {
    const user = await this.userModel.findOne({
      _id: new mongoose.Types.ObjectId(userId),
      isDeleted: false,
    });
    const userSubcriptionType = user.subscriptionType;

    if (
      userSubcriptionType === SubscriptionType.LIFETIME &&
      requestedPlanType === SubscriptionType.LIFETIME &&
      user.subscriptionPayment === 'SUCCESS'
    ) {
      return {
        status: false,
        msg: 'You already have a lifetime subscription plan.',
      };
    }

    if (
      userSubcriptionType === SubscriptionType.LIFETIME &&
      requestedPlanType === SubscriptionType.ANNUAL &&
      user.subscriptionPayment === 'SUCCESS'
    ) {
      return {
        status: false,
        msg: 'You already have a lifetime subscription plan,So you cannot take an annual subscription plan.',
      };
    } else {
      return {
        status: true,
        msg: `All good.`,
      };
    }
  }

  /**
   * function to calculate expiry date
   */
  // async expiryDate(num, userId, createdAt, userSubscriptionType) {
  //   const date = moment(createdAt);
  //   const user = await this.userModel.findOne({
  //     _id: new mongoose.Types.ObjectId(userId),
  //     isDeleted: false,
  //   });
  //   const userCreatedAt = user['createdAt'];
  //   const planExpiry = user.subscriptionPlanExpiryDate;

  //   if (userSubscriptionType === SubscriptionType.ANNUAL) {
  //     const remainingDays = moment(planExpiry).diff(userCreatedAt, 'days');
  //     date.add(num + remainingDays, 'days');
  //   } else {
  //     date.add(num, 'days');
  //   }

  //   const formattedDate = date.format('YYYY-MM-DD');

  //   return formattedDate;
  // }

  async expiryDate(subscriptionPlanDays, planExpiry, userSubscriptionType) {
    const currentDate = moment()
      .utcOffset('+05:30')
      .format('YYYY-MM-DD HH:mm:ss');

    const date = moment(currentDate);
    if (userSubscriptionType === SubscriptionType.ANNUAL) {
      if (planExpiry !== '') {
        const currentDate = moment();
        const remainingDays = moment(planExpiry).diff(currentDate, 'days');
        // const remainingDays = moment(planExpiry).diff(planExpiry, 'days');
        date.add(subscriptionPlanDays + remainingDays, 'days');
      } else {
        date.add(subscriptionPlanDays, 'days');
      }
    } else {
      date.add(subscriptionPlanDays, 'days');
    }

    const formattedDate = date.format('YYYY-MM-DD');

    return formattedDate;
  }
}
