export class CreateAllAccessFieldsDto {
  moduleGroup: string;
  fields: {
    fieldName: string;
    displayName: string;
  }[];
}
