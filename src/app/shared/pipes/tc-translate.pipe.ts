import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../../core/services/language.service';

@Pipe({ name: 'tcTranslate', standalone: true, pure: false })
export class TcTranslatePipe implements PipeTransform {
  private readonly language = inject(LanguageService);

  transform(key: string, fallback?: string): string {
    // Depend on the signal so impure pipe refreshes when language changes.
    this.language.language();
    return this.language.t(key, fallback);
  }
}
