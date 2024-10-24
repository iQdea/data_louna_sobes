import { Exclude, Expose } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

@Exclude()
export class ErrorResponse {
  @Expose()
  @ApiProperty()
  detail!: string

  @Expose()
  @ApiProperty()
  status!: number

  @Expose()
  @ApiPropertyOptional()
  stack?: string
}