export class CreateAdminRoleDto {
  roleName: string;
  modules: {
    action: string;
    fields: string;
  };
}
