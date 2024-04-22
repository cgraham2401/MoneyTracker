import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router, CanActivateFn } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { inject } from '@angular/core';
import { map, catchError, of } from 'rxjs';

// Define a canActivate function
export const canActivateAuth: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const auth = inject(AngularFireAuth);
  const router = inject(Router);

  return auth.authState.pipe(
    map(user => {
      // If user is logged in, allow access, otherwise redirect to login
      return !!user || router.createUrlTree(['/login']);
    }),
    catchError(() => {
      // If error, redirect to login
      return of(router.createUrlTree(['/login']));
    })
  );
};
