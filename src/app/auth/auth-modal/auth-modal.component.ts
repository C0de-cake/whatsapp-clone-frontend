import {Component, inject} from '@angular/core';
import {Oauth2AuthService} from "../oauth2-auth.service";

@Component({
  selector: 'wac-auth-modal',
  standalone: true,
  imports: [],
  templateUrl: './auth-modal.component.html',
  styleUrl: './auth-modal.component.scss'
})
export class AuthModalComponent {

  oauth2Service = inject(Oauth2AuthService);

  login() {
    this.oauth2Service.login();
  }
}
