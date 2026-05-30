import { Component , ChangeDetectionStrategy} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-auth-layout',
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ToastModule,CardModule,RouterOutlet],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
  providers: [MessageService]
})
export class AuthLayoutComponent {

}
