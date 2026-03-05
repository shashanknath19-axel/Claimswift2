import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Skip adding auth header for login/register endpoints
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
    return next(req);
  }

  let authReq = req;
  if (token) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  return next(authReq).pipe(
    catchError(error => {
      if (error.status === 401) {
        const errorCode = String(error?.error?.code ?? error?.error?.errorCode ?? '').toUpperCase();
        const message = String(error?.error?.message ?? error?.message ?? '').toLowerCase();
        const tokenExpired = errorCode.includes('TOKEN_EXPIRED') || message.includes('token expired');
        const invalidToken = errorCode.includes('INVALID_TOKEN') || message.includes('invalid token') || message.includes('jwt');
        const authError = errorCode.includes('AUTH_ERROR');
        const shouldLogout = tokenExpired || invalidToken || authError;

        if (shouldLogout) {
          authService.clearSessionAndRedirect();
        }
      }
      return throwError(() => error);
    })
  );
};
