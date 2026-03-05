import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

let activeRequestCount = 0;

export const loadingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  activeRequestCount += 1;
  document.body.classList.add('app-loading');

  return next(req).pipe(
    finalize(() => {
      activeRequestCount = Math.max(0, activeRequestCount - 1);
      if (activeRequestCount === 0) {
        document.body.classList.remove('app-loading');
      }
    })
  );
};
