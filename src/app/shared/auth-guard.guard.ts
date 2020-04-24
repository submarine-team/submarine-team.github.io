import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}
  async canActivate() {
    if (await this.authService.authStateTrack()) {
      console.log('MOZES DA VLEZES ANGELU!');
      return true;
    } else {
      console.log('ZASTANI ZAD MENE SATANO!');
      this.router.navigate(['/']);
      return false;
    }
  }
}