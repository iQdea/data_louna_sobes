export interface TokenPayload {
  userId: string;
  email: string;
}

export interface TokenDto {
  access_token: string;
  refresh_token: string;
}