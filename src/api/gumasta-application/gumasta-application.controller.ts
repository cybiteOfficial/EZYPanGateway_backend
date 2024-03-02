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
import { GumastaApplicationService } from './gumasta-application.service';
import {
  CreateGumastaApplicationDto,
  ChangeStatusDto,
} from './dto/create-gumasta-application.dto';
import { UpdateGumastaApplicationDto } from './dto/update-gumasta-application.dto';
import { DocumentMiddleware } from '../../middleware/image.middleware';

@Controller('gumasta-application')
export class GumastaApplicationController {
  constructor(
    private readonly gumastaApplicationService: GumastaApplicationService,
  ) {}

  //-------------------------------------------------------------------------
  /***
   * create new user
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(
    @Body() createGumastaApplicationDto: CreateGumastaApplicationDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.gumastaApplicationService.add(
      createGumastaApplicationDto,
      res,
      req,
    );
  }
  //-------------------------------------------------------------------------
  /***
   * retry payment
   */
  //-------------------------------------------------------------------------

  @Post('/retry-payment')
  retryPayment(@Query('srn') srn: any, @Res() res: any, @Req() req: any) {
    return this.gumastaApplicationService.retryPaymnet(srn, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * download zip with srn
   */
  //-------------------------------------------------------------------------

  @Get('/zip')
  downloadZip(@Query('srn') srn: string, @Res() res: any, @Req() req: any) {
    return this.gumastaApplicationService.downloadZip(srn, res, req);
  }
  //-------------------------------------------------------------------------
  /***
   *  status of application
   */
  //-------------------------------------------------------------------------

  @Get('/get-allstatuscounts')
  statusCounts(@Res() res: any, @Req() req: any) {
    return this.gumastaApplicationService.statusCounts(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all users
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.gumastaApplicationService.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find user
   */
  //-------------------------------------------------------------------------

  @Get('/view')
  findOne(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.gumastaApplicationService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find user for admin
   */
  //-------------------------------------------------------------------------

  @Get('/admin/view')
  findOneForAdmin(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.gumastaApplicationService.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find gumasta for user with srn
   */
  //-------------------------------------------------------------------------

  @Get('/view-with-srn')
  findOneWithSrn(@Query('srn') srn: string, @Res() res: any, @Req() req: any) {
    return this.gumastaApplicationService.findOneWithSrn(srn, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update user
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(
    @Query('id') id: string,
    @Body() updateGumastaApplicationDto: UpdateGumastaApplicationDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.gumastaApplicationService.update_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.gumastaApplicationService.allWithFilters(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * get paymentPend applications
   */
  //-------------------------------------------------------------------------

  @Post('/admin/list/payment-pending')
  getPaymentPendingApplicatins(@Req() req: any, @Res() res: any) {
    return this.gumastaApplicationService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * getpendingApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-pending-applications')
  getpendingApplications(@Req() req: any, @Res() res: any) {
    return this.gumastaApplicationService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * getInprogressApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-inprogress-applications')
  getInprogressApplications(@Req() req: any, @Res() res: any) {
    return this.gumastaApplicationService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * wgetVerifiedApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-verified-applications')
  getVerifiedApplications(@Req() req: any, @Res() res: any) {
    return this.gumastaApplicationService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * getRejectedApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-rejected-applications')
  getRejectedApplications(@Req() req: any, @Res() res: any) {
    return this.gumastaApplicationService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * getGenerateApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-generate-applications')
  getGenerateApplications(@Req() req: any, @Res() res: any) {
    return this.gumastaApplicationService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * getsDoneApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-done-applications')
  getsDoneApplications(@Req() req: any, @Res() res: any) {
    return this.gumastaApplicationService.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * getCancelledeApplications
   */
  //-------------------------------------------------------------------------

  @Post('/get-cancelled-applications')
  getCancelledeApplications(@Req() req: any, @Res() res: any) {
    return this.gumastaApplicationService.statusWiseFilter(req, res);
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
    return this.gumastaApplicationService.updateStatus(id, res, req, file);
  }

  //-------------------------------------------------------------------------
  /***
   *  assign to
   */
  //-------------------------------------------------------------------------

  @Post('/assign-to')
  assignTo(@Query() id: string, @Res() res: any, @Req() req: any) {
    return this.gumastaApplicationService.assignTo(id, res, req);
  }

  /***
   * with filter pagination for web to check srn
   */
  //-------------------------------------------------------------------------

  @Post('/list/history')
  filterSrnForWeb(@Req() req: any, @Res() res: any) {
    return this.gumastaApplicationService.history(req, res);
  }

  /***
   * with payment list for web to check srn
   */
  //-------------------------------------------------------------------------

  @Post('/payment-history')
  paymentHistory(@Req() req: any, @Res() res: any) {
    return this.gumastaApplicationService.paymentHistory(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * get status history
   */
  //-------------------------------------------------------------------------

  @Put('/get-status-history')
  getStatusHistory(@Query('id') id: string, @Req() req: any, @Res() res: any) {
    return this.gumastaApplicationService.getStatusHistory(id, req, res);
  }
}
