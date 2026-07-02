import { Component , ChangeDetectionStrategy} from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-auth-layout',
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ToastModule, RouterOutlet, RouterLink],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
  providers: [MessageService]
})
export class AuthLayoutComponent {

}
