import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxUiLoaderModule } from 'ngx-ui-loader';
import { ThemeService } from './shared/theme/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,NgxUiLoaderModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly themeService = inject(ThemeService);

  title = 'thinkerscave_saas_frontend';
}
