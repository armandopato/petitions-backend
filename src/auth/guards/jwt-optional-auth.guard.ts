import { AuthGuard } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";

@Injectable()
export class JwtOptionalAuthGuard extends AuthGuard('jwt') {

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  handleRequest(err, user)
  {
	  return user;
  }

}