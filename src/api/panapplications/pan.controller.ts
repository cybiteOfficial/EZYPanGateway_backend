import { UpdatePanApplicationDto } from './dto/update-pan.dto';
import { PanAppServices } from './pan.service';
import { ChangeStatusDto } from './dto/create-pan.dto';
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
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { DocumentMiddleware } from '../../middleware/image.middleware';

@Controller('pan-app')
export class PanAppController {
  constructor(private readonly panAppServices: PanAppServices) {}

  //-------------------------------------------------------------------------
  /***
   * add pan application
   */
  //-------------------------------------------------------------------------

  @Post('/add')
  register(@Res() res: any, @Req() req: any) {
    return this.panAppServices.add(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * retry payment
   */
  //-------------------------------------------------------------------------

  @Post('/retry-payment')
  retryPayment(@Query('srn') srn: any, @Res() res: any, @Req() req: any) {
    return this.panAppServices.retryPaymnet(srn, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   *  assign to
   */
  //-------------------------------------------------------------------------

  @Post('/assign-to')
  assignTo(@Query() id: string, @Res() res: any, @Req() req: any) {
    return this.panAppServices.assignTo(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   *  status of application
   */
  //-------------------------------------------------------------------------

  @Get('/get-allstatuscounts')
  statusCounts(@Res() res: any, @Req() req: any) {
    return this.panAppServices.statusCounts(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find all pans
   */
  //-------------------------------------------------------------------------

  @Get('/get-all')
  findAll(@Res() res: any, @Req() req: any) {
    return this.panAppServices.list(res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find pan
   */
  //-------------------------------------------------------------------------

  @Get('/view')
  findOne(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.panAppServices.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find pan
   */
  //-------------------------------------------------------------------------

  @Get('/admin/view')
  findOneForAdmin(@Query('id') id: string, @Res() res: any, @Req() req: any) {
    return this.panAppServices.view(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * find pan for user with srn
   */
  //-------------------------------------------------------------------------

  @Get('/view-with-srn')
  findOneWithSrn(@Query('srn') srn: string, @Res() res: any, @Req() req: any) {
    return this.panAppServices.findOneWithSrn(srn, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * download zip with srn
   */
  //-------------------------------------------------------------------------

  @Get('/zip')
  downloadZip(@Query('srn') srn: string, @Res() res: any, @Req() req: any) {
    return this.panAppServices.downloadZip(srn, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * update pan
   */
  //-------------------------------------------------------------------------

  @Put('/update')
  update(
    @Query('id') id: string,
    @Body() updatePanApplicationDto: UpdatePanApplicationDto,
    @Res() res: any,
    @Req() req: any,
  ) {
    return this.panAppServices.update_by_id(id, res, req);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/list/pagination')
  filter(@Req() req: any, @Res() res: any) {
    return this.panAppServices.allWithFilters(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * get paymentPend applications
   */
  //-------------------------------------------------------------------------

  @Post('/admin/list/payment-pending')
  getPaymentPendingApplicatins(@Req() req: any, @Res() res: any) {
    return this.panAppServices.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/get-pending-applications')
  getpendingApplications(@Req() req: any, @Res() res: any) {
    return this.panAppServices.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/get-inprogress-applications')
  getInprogressApplications(@Req() req: any, @Res() res: any) {
    return this.panAppServices.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/get-verified-applications')
  getVerifiedApplications(@Req() req: any, @Res() res: any) {
    return this.panAppServices.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/get-rejected-applications')
  getRejectedApplications(@Req() req: any, @Res() res: any) {
    return this.panAppServices.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/get-generate-applications')
  getGenerateApplications(@Req() req: any, @Res() res: any) {
    return this.panAppServices.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/get-done-applications')
  getsDoneApplications(@Req() req: any, @Res() res: any) {
    return this.panAppServices.statusWiseFilter(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * with filter pagination
   */
  //-------------------------------------------------------------------------

  @Post('/get-cancelled-applications')
  getCancelledeApplications(@Req() req: any, @Res() res: any) {
    return this.panAppServices.statusWiseFilter(req, res);
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
    @Res() res: any,
    @Req() req: any,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.panAppServices.updateStatus(id, res, req, file);
  }

  /***
   * with filter pagination for web to check srn
   */
  //-------------------------------------------------------------------------

  @Post('/list/history')
  filterSrnForWeb(@Req() req: any, @Res() res: any) {
    return this.panAppServices.history(req, res);
  }

  /***
   * with payment list for web to check srn
   */
  //-------------------------------------------------------------------------

  @Post('/payment-history')
  paymentHistory(@Req() req: any, @Res() res: any) {
    return this.panAppServices.paymentHistory(req, res);
  }

  //-------------------------------------------------------------------------
  /***
   * get status history
   */
  //-------------------------------------------------------------------------

  @Put('/get-status-history')
  getStatusHistory(@Query('id') id: string, @Req() req: any, @Res() res: any) {
    return this.panAppServices.getStatusHistory(id, req, res);
  }
}
