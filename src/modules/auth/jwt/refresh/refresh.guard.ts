import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export default class RefreshGuard extends AuthGuard('jwt-refresh-token') {}