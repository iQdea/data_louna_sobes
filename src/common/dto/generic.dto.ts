import { IsNumber, Min } from 'class-validator';
import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';

function toNumber(value: any): number {
  let result = Number(value);
  if (isNaN(result)) {
    return 0;
  }
  return result
}

@Exclude()
export class GenericFilter {
  @Expose()
  @ApiProperty()
  @Transform(({ value }) => toNumber(value))
  @Min(1)
  @IsNumber({}, { message: ' "page" atrribute should be a number' })
  page!: number;

  @Expose()
  @ApiProperty()
  @Transform(({ value }) => toNumber(value))
  @Min(1)
  @IsNumber({}, { message: ' "pageSize" attribute should be a number ' })
  pageSize!: number;
}

@Exclude()
export class Generic {}

@Exclude()
export class QueryGeneric extends IntersectionType(GenericFilter, Generic) {}