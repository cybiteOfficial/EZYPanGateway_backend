import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Query,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { digitalSignService } from './digital-sign.service';
import {
  CreateDigitalSignDto,
  ChangeStatusDto,
} from './dto/create-digital-sign.dto';
import { UpdateDigitalSignDto } from './dto/update-digital-sign.dto';
import { DocumentMiddleware } from '../../middleware/image.middleware';

@Controller('dsc-application')
export class digitalSignController {
  constructor(private readonly DigitalSignService: digitalSignService) {}

  //-------------------------------------------------------------------------
  /***
   * create new dsc
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(
    @Body() createdigitalSignDto: CreateDigitalSignDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.DigitalSignService.add(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * retry payment
   */
  //-------------------------------------------------------------------------

  @Post('/retry-payment')
  retryPayment(
    @Query('srn') srn: any,
    @Body() createdigitalSignDto: CreateDigitalSignDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.DigitalSignService.retryPaymnet(srn, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   *  assign to
   */
  //-------------------------------------------------------------------------

  @Post('/assign-to')
  assignTo(@Query() id: string, @Res() res: any, @Req() req: any) {
    return this.DigitalSignService.assignTo(id, res, req);
  }
  //-------------------------------------------------------------------------
  /***
   * find all dscs
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.DigitalSignService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * download zip with srn
   */
  //-------------------------------------------------------------------------

  @Get('/zip')
  downloadZip(@Query('srn') srn: string, @Res() res: any, @Req() req: any) {
    return this.DigitalSignService.downloadZip(srn, res, req);
  }
  //-------------------------------------------------------------------------
  /***
   *  status of application
   */
  //-------------------------------------------------------------------------

  @Get('/get-allstatuscounts')
  statusCounts(@Res() res: any, @Req() req: any) {
    return this.DigitalSignService.statusCounts(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find dsc for user
   */
  //-------------------------------------------------------------------------

  @Get('/view')
  findOne(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.DigitalSignService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find dsc for user
   */
  //-------------------------------------------------------------------------

  @Get('/view-with-srn')
  findOneWithSrn(@Query('srn') srn: string, @Res() res: any, @Req() req: any) {
    return this.DigitalSignService.findOneWithSrn(srn, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find dsc for admin
   */
  //-------------------------------------------------------------------------

  @Get('/admin/view')
  findOneForAdmin(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.DigitalSignService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update dsc
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(
    @Query('id') id: string,
    @Body() updatedigitalSignDto: UpdateDigitalSignDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.DigitalSignService.update_by_id(
      id,
      updatedigitalSignDto,
      res,
      req,
    );
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.DigitalSignService.allWithFilters(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * get paymentPend applications
   */
  //-------------------------------------------------------------------------

  @Post('/admin/list/payment-pending')
  getPaymentPendingApplicatins(@Req() req: any, @Res() res: any) {
    return this.DigitalSignService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * getpendingApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-pending-applications')
  getpendingApplications(@Req() req: any, @Res() res: any) {
    return this.DigitalSignService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * getInprogressApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-inprogress-applications')
  getInprogressApplications(@Req() req: any, @Res() res: any) {
    return this.DigitalSignService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * wgetVerifiedApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-verified-applications')
  getVerifiedApplications(@Req() req: any, @Res() res: any) {
    return this.DigitalSignService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * getRejectedApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-rejected-applications')
  getRejectedApplications(@Req() req: any, @Res() res: any) {
    return this.DigitalSignService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * getGenerateApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-generate-applications')
  getGenerateApplications(@Req() req: any, @Res() res: any) {
    return this.DigitalSignService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * getsDoneApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-done-applications')
  getsDoneApplications(@Req() req: any, @Res() res: any) {
    return this.DigitalSignService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * getCancelledeApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-cancelled-applications')
  getCancelledeApplications(@Req() req: any, @Res() res: any) {
    return this.DigitalSignService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * update status of application
   */
  //-------------------------------------------------------------------------

  @Put('/update-status')
  @UseInterceptors(DocumentMiddleware)
  updateStatus(
    @Query('id') id: string,
    @Body() changeStatusDto: ChangeStatusDto,
    @Res() res: any,
    @Req() req: any,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.DigitalSignService.updateStatus(id, res, req, file);
  }

  /***
   * with filter pagination for web to check srn
   */
  //-------------------------------------------------------------------------

  @Post('/list/history')
  history(@Req() req: any, @Res() res: any) {
    return this.DigitalSignService.history(req, res);
  }

  /***
   * with payment list for web to check srn
   */
  //-------------------------------------------------------------------------

  @Post('/payment-history')
  paymentHistory(@Req() req: any, @Res() res: any) {
    return this.DigitalSignService.paymentHistory(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * get status history
   */
  //-------------------------------------------------------------------------

  @Put('/get-status-history')
  getStatusHistory(@Query('id') id: string, @Req() req: any, @Res() res: any) {
    return this.DigitalSignService.getStatusHistory(id, req, res);
  }
}
