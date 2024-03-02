import { Controller, Get, Req, Res } from "@nestjs/common";
import { DashboardService } from "./dashboard.sevice";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("/application-count")
  findAllForAdmin(@Res() res: any, @Req() req: any) {
    return this.dashboardService.applicationCount(res, req);
  }
  @Get("/user-count")
  userCountForSuperAdmin(@Res() res: any, @Req() req: any) {
    return this.dashboardService.userCountForSuperAdmin(res, req);
  }
}
