import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SKIP_GLOBAL_ERROR } from './http-context.tokens';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const toastr = inject(ToastrService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const silentByContext = req.context.get(SKIP_GLOBAL_ERROR);
      const silentByMethodStatus = req.method === 'GET' && (error.status === 404 || error.status === 503);

      if (error.status !== 401 && !silentByContext && !silentByMethodStatus) {
        const message = error.error?.message || error.message || 'Request failed';
        toastr.error(String(message), 'Error');
      }
      return throwError(() => error);
    })
  );
};
