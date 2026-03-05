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
      const payload = extractErrorPayload(error);
      const tokenAuthError = error.status === 401 && isTokenAuthError(payload.code, payload.message);

      if (!silentByContext && !silentByMethodStatus && !tokenAuthError) {
        const title = mapErrorTitle(payload.status);
        const message = mapErrorMessage(payload.status, payload.code, payload.message);
        const withRequestId = payload.requestId
          ? `${message}\nReference ID: ${payload.requestId}`
          : message;
        toastr.error(withRequestId, title, {
          timeOut: 6000,
          closeButton: true
        });
      }
      return throwError(() => error);
    })
  );
};

function extractErrorPayload(error: HttpErrorResponse): {
  status: number;
  code: string;
  message: string;
  requestId: string;
} {
  const responseObject = typeof error.error === 'object' && error.error !== null ? error.error : {};
  return {
    status: error.status,
    code: String(responseObject.code ?? responseObject.errorCode ?? '').toUpperCase(),
    message: String(responseObject.message ?? error.message ?? 'Request failed'),
    requestId: String(responseObject.requestId ?? '')
  };
}

function isTokenAuthError(code: string, message: string): boolean {
  const lowered = message.toLowerCase();
  return code.includes('TOKEN_EXPIRED')
    || code.includes('INVALID_TOKEN')
    || code.includes('AUTH_ERROR')
    || lowered.includes('token expired')
    || lowered.includes('invalid token')
    || lowered.includes('jwt');
}

function mapErrorTitle(status: number): string {
  if (status === 400) {
    return 'Invalid Request';
  }
  if (status === 401) {
    return 'Authentication Failed';
  }
  if (status === 403) {
    return 'Access Denied';
  }
  if (status === 404) {
    return 'Not Found';
  }
  if (status === 415) {
    return 'Unsupported File';
  }
  if (status === 503) {
    return 'Service Unavailable';
  }
  return 'Request Failed';
}

function mapErrorMessage(status: number, code: string, fallback: string): string {
  if (status === 415 || code === 'UNSUPPORTED_MEDIA_TYPE') {
    return 'Only PDF files are supported. Please upload a valid PDF document.';
  }
  if (status === 503 || code === 'SERVICE_UNAVAILABLE') {
    return 'Service is temporarily unavailable. Please retry in a moment.';
  }
  if (status === 401) {
    return 'Authentication could not be verified. Please retry; if it continues, sign in again.';
  }
  if (status === 403 || code === 'ACCESS_DENIED') {
    return 'You do not have permission to perform this action.';
  }
  if (status === 400 && code === 'VALIDATION_ERROR') {
    return 'Some fields are invalid. Please review and try again.';
  }
  return fallback || 'Request failed';
}
