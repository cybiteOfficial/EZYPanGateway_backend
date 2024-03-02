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
import { ItrApplicationService } from './itr-application.service';
import {
  CreateItrApplicationDto,
  ChangeStatusDto,
} from './dto/create-itr-application.dto';
import { UpdateItrApplicationDto } from './dto/update-itr-application.dto';
import { DocumentMiddleware } from '../../middleware/image.middleware';

@Controller('itr-application')
export class ItrApplicationController {
  constructor(private readonly itrApplicationService: ItrApplicationService) {}

  //-------------------------------------------------------------------------
  /***
   * create new user
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(
    @Body()
    createItrApplicationDto: CreateItrApplicationDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.itrApplicationService.add(createItrApplicationDto, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * retry payment
   */
  //-------------------------------------------------------------------------

  @Post('/retry-payment')
  retryPayment(@Query('srn') srn: any, @Res() res: any, @Req() req: any) {
    return this.itrApplicationService.retryPaymnet(srn, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * download zip with srn
   */
  //-------------------------------------------------------------------------

  @Get('/zip')
  downloadZip(@Query('srn') srn: string, @Res() res: any, @Req() req: any) {
    return this.itrApplicationService.downloadZip(srn, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   *  status of application
   */
  //-------------------------------------------------------------------------

  @Get('/get-allstatuscounts')
  statusCounts(@Res() res: any, @Req() req: any) {
    return this.itrApplicationService.statusCounts(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all users
   */
  //-------------------------------------------------------------------------

  @Get('/admin/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.itrApplicationService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find user for app
   */
  //-------------------------------------------------------------------------

  @Get('/view')
  findOne(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.itrApplicationService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find user for admin
   */
  //-------------------------------------------------------------------------

  @Get('/admin/view')
  findOneForAdmin(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.itrApplicationService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find itr for user with srn
   */
  //-------------------------------------------------------------------------

  @Get('/view-with-srn')
  findOneWithSrn(@Query('srn') srn: string, @Res() res: any, @Req() req: any) {
    return this.itrApplicationService.findOneWithSrn(srn, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update user
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(
    @Query('id') id: string,
    @Body() updateItrApplicationDto: UpdateItrApplicationDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.itrApplicationService.update_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.itrApplicationService.allWithFilters(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * get paymentPend applications
   */
  //-------------------------------------------------------------------------

  @Post('/admin/list/payment-pending')
  getPaymentPendingApplicatins(@Req() req: any, @Res() res: any) {
    return this.itrApplicationService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * getpendingApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-pending-applications')
  getpendingApplications(@Req() req: any, @Res() res: any) {
    return this.itrApplicationService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * getInprogressApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-inprogress-applications')
  getInprogressApplications(@Req() req: any, @Res() res: any) {
    return this.itrApplicationService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * wgetVerifiedApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-verified-applications')
  getVerifiedApplications(@Req() req: any, @Res() res: any) {
    return this.itrApplicationService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * getRejectedApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-rejected-applications')
  getRejectedApplications(@Req() req: any, @Res() res: any) {
    return this.itrApplicationService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * getGenerateApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-generate-applications')
  getGenerateApplications(@Req() req: any, @Res() res: any) {
    return this.itrApplicationService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * getsDoneApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-done-applications')
  getsDoneApplications(@Req() req: any, @Res() res: any) {
    return this.itrApplicationService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * getCancelledeApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-cancelled-applications')
  getCancelledeApplications(@Req() req: any, @Res() res: any) {
    return this.itrApplicationService.statusWiseFilter(req, res);
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
    return this.itrApplicationService.updateStatus(id, res, req, file);
  }

  //-------------------------------------------------------------------------
  /***
   *  assign to
   */
  //-------------------------------------------------------------------------

  @Post('/assign-to')
  assignTo(@Query() id: string, @Res() res: any, @Req() req: any) {
    return this.itrApplicationService.assignTo(id, res, req);
  }

  /***
   * with filter pagination for web to check srn
   */
  //-------------------------------------------------------------------------

  @Post('/list/history')
  filterSrnForWeb(@Req() req: any, @Res() res: any) {
    return this.itrApplicationService.history(req, res);
  }

  /***
   * with payment list for web to check srn
   */
  //-------------------------------------------------------------------------

  @Post('/payment-history')
  paymentHistory(@Req() req: any, @Res() res: any) {
    return this.itrApplicationService.paymentHistory(req, res);
  }
  //-------------------------------------------------------------------------
  /***
   * get status history
   */
  //-------------------------------------------------------------------------

  @Put('/get-status-history')
  getStatusHistory(@Query('id') id: string, @Req() req: any, @Res() res: any) {
    return this.itrApplicationService.getStatusHistory(id, req, res);
  }
}
