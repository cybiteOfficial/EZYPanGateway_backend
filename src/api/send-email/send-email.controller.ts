import { Controller, Post, Req, Res } from '@nestjs/common';
import { SendEmailService } from './send-email.service';

@Controller('send-email')
export class SendEmailController {
  constructor(private readonly SendEmailService: SendEmailService) {}

  //-------------------------------------------------------------------------
  /***
   * create new SendEmail
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  add(@Res() res: any, @Req() req: any) {
    return this.SendEmailService.add(res, req);
  }
}
