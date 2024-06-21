import {HttpInterceptorFn} from "@angular/common/http";
import {inject} from "@angular/core";
import {Oauth2AuthService} from "./oauth2-auth.service";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const oauth2Service = inject(Oauth2AuthService);
  const token = oauth2Service.accessToken;
  if(token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  return next(req);
}
