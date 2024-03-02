import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { getUniqueTransactionId } from '../../helper/paymentGatewayHelper';
import {
  Transaction,
  TransactionSchema,
} from '../transaction/entities/transaction.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [],
  providers: [getUniqueTransactionId],
})
export class DigitalPanWalletTransactionModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {}
}
