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
import { MsmeApplicationService } from './msme-application.service';
import {
  CreateMsmeApplicationDto,
  ChangeStatusDto,
} from './dto/create-msme-application.dto';
import { UpdateMsmeApplicationDto } from './dto/update-msme-application.dto';
import { DocumentMiddleware } from '../../middleware/image.middleware';

@Controller('msme-application')
export class MsmeApplicationController {
  constructor(
    private readonly msmeApplicationService: MsmeApplicationService,
  ) {}

  //-------------------------------------------------------------------------
  /***
   * create new user
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(
    @Body() createMsmeApplicationDto: CreateMsmeApplicationDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.msmeApplicationService.add(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * retry payment
   */
  //-------------------------------------------------------------------------

  @Post('/retry-payment')
  retryPayment(@Query('srn') srn: any, @Res() res: any, @Req() req: any) {
    return this.msmeApplicationService.retryPaymnet(srn, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   *  assign to
   */
  //-------------------------------------------------------------------------

  @Post('/assign-to')
  assignTo(@Query() id: string, @Res() res: any, @Req() req: any) {
    return this.msmeApplicationService.assignTo(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   *  status of application
   */
  //-------------------------------------------------------------------------

  @Get('/get-allstatuscounts')
  statusCounts(@Res() res: any, @Req() req: any) {
    return this.msmeApplicationService.statusCounts(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all users
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.msmeApplicationService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find one for user
   */
  //-------------------------------------------------------------------------

  @Get('/view')
  findOne(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.msmeApplicationService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find one for admin user
   */
  //-------------------------------------------------------------------------

  @Get('/admin/view')
  findOneForAdmin(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.msmeApplicationService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * download zip with srn
   */
  //-------------------------------------------------------------------------

  @Get('/zip')
  downloadZip(@Query('srn') srn: string, @Res() res: any, @Req() req: any) {
    return this.msmeApplicationService.downloadZip(srn, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find msme for user with srn
   */
  //-------------------------------------------------------------------------

  @Get('/view-with-srn')
  findOneWithSrn(@Query('srn') srn: string, @Res() res: any, @Req() req: any) {
    return this.msmeApplicationService.findOneWithSrn(srn, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update user
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(
    @Query('id') id: string,
    @Body() updateMsmeApplicationDto: UpdateMsmeApplicationDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.msmeApplicationService.update_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.msmeApplicationService.allWithFilters(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * get paymentPend applications
   */
  //-------------------------------------------------------------------------

  @Post('/admin/list/payment-pending')
  getPaymentPendingApplicatins(@Req() req: any, @Res() res: any) {
    return this.msmeApplicationService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * getpendingApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-pending-applications')
  getpendingApplications(@Req() req: any, @Res() res: any) {
    return this.msmeApplicationService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * getInprogressApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-inprogress-applications')
  getInprogressApplications(@Req() req: any, @Res() res: any) {
    return this.msmeApplicationService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * wgetVerifiedApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-verified-applications')
  getVerifiedApplications(@Req() req: any, @Res() res: any) {
    return this.msmeApplicationService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * getRejectedApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-rejected-applications')
  getRejectedApplications(@Req() req: any, @Res() res: any) {
    return this.msmeApplicationService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * getGenerateApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-generate-applications')
  getGenerateApplications(@Req() req: any, @Res() res: any) {
    return this.msmeApplicationService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * getsDoneApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-done-applications')
  getsDoneApplications(@Req() req: any, @Res() res: any) {
    return this.msmeApplicationService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * getCancelledeApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-cancelled-applications')
  getCancelledeApplications(@Req() req: any, @Res() res: any) {
    return this.msmeApplicationService.statusWiseFilter(req, res);
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
    return this.msmeApplicationService.updateStatus(id, res, req, file);
  }

  /***
   * with filter pagination for web to check srn
   */
  //-------------------------------------------------------------------------

  @Post('/list/history')
  filterSrnForWeb(@Req() req: any, @Res() res: any) {
    return this.msmeApplicationService.history(req, res);
  }

  /***
   * with payment list for web to check srn
   */
  //-------------------------------------------------------------------------

  @Post('/payment-history')
  paymentHistory(@Req() req: any, @Res() res: any) {
    return this.msmeApplicationService.paymentHistory(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * get status history
   */
  //-------------------------------------------------------------------------

  @Put('/get-status-history')
  getStatusHistory(@Query('id') id: string, @Req() req: any, @Res() res: any) {
    return this.msmeApplicationService.getStatusHistory(id, req, res);
  }
}
