import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * A functional HTTP interceptor that adds the X-Tenant-ID header to outgoing requests.
 * @param req The outgoing request object to handle.
 * @param next The next interceptor in the chain, or the backend if no others remain.
 * @returns An Observable of the event stream.
 */
export const tenantInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  
  // In a real application, you would get the tenant ID from a service
  // after the user has logged in. For now, we can hardcode it for testing.
  const tenantId = 'public'; // Example tenant ID. Replace with your actual tenant identifier.

  // Clone the request to add the new header.
  const modifiedRequest = req.clone({
    headers: req.headers.set('X-Tenant-ID', tenantId)
  });

  // Pass the cloned request to the next handler in the chain.
  return next(modifiedRequest);
};

