export class CreateAdminDto {
  userName: string;
  password: string;
  confirm_password: string;
  email: string;
  mobile: string;
  role: string;
  printWaitTime: number;
  isDeleted: false;
  isActive: boolean;
}
