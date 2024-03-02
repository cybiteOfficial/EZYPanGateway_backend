import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/entities/user.entity';
import * as moment from 'moment';
import {
  DigitalPanWallet,
  DigitalPanWalletDocument,
} from './entities/digital-pan-wallet.entity';

import {
  DigitalPanTransactions,
  DigitalPanTransactionsDocument,
} from '../digital-pan-wallet-transaction/entities/digital-pan-wallet-transaction.entity';
export class WalletAmt {
  [x: string]: any;
  constructor(
    @InjectModel(DigitalPanWallet.name)
    private DigitalPanWalletModel: Model<DigitalPanWalletDocument>,
    @InjectModel(DigitalPanTransactions.name)
    private DigitalPanTransactionsModel: Model<DigitalPanTransactionsDocument>,
    @InjectModel(User.name)
    private UserModel: Model<UserDocument>,
  ) {}

  /**
   * create wallet with zero wallet
   */
  async createWallet(userId: any) {
    const currentDate = moment()
      .utcOffset('+05:30')
      .format('YYYY-MM-DD HH:mm:ss');
    // create wallet
    const walletData = {
      walletType: '',
      walletAmount: 0,
      userId: userId,
    };
    const digitalPanWallet = await new this.DigitalPanWalletModel({
      ...walletData,
    }).save();

    //create user digital-pan wallet
    // const createUserdigitalPanWallet =
    //   await new this.DigitalPanTransactionsModel({
    //     userId: userId,
    //     remark: `Wallet created with amount 0  at ${currentDate}.`,
    //   }).save();

    return digitalPanWallet;
  }
}
