import { Exclude, Expose } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

@Exclude()
class User {
  @Expose()
  @ApiProperty()
  id!: string
}

@Exclude()
export class UserBalance {
  @Expose()
  @ApiProperty()
  balance!: number
}

@Exclude()
export class UserResponse extends User {
  @Expose()
  @ApiPropertyOptional()
  email!: string;
}

@Exclude()
export class UserGetByEmailResponse extends User {
  password!: string
}

@Exclude()
export class UserGetByIdResponse {
  @Expose()
  @ApiProperty()
  email!: string

  password!: string
}

@Exclude()
export class UserPasswordUpdateRequest {
  id!: string

  @Expose()
  @ApiProperty( { default: 'test1'})
  oldPassword!: string

  @Expose()
  @ApiProperty( { default: 'test1'})
  newPassword!: string
}

@Exclude()
export class AuthRequest {
  @Expose()
  @ApiProperty({ default: '1@ya.ru'})
  @IsEmail()
  email!: string;

  @Expose()
  @ApiProperty({ default: 'test123!'})
  @IsString()
  @IsNotEmpty()
  password!: string;
}