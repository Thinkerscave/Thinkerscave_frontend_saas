import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, tap, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';

export interface TenantConfig {
    courseLabel: string;
    containerLabel: string;
    studentLabel: string;
    allowedContainerTypes: string[];
}

@Injectable({
    providedIn: 'root'
})
export class TenantConfigService {
    private configSubject = new BehaviorSubject<TenantConfig | null>(null);
    public config$ = this.configSubject.asObservable();
    private readonly logger = inject(LoggerService);

    constructor(private http: HttpClient) {
        this.initializeFromStorage();
    }

    private initializeFromStorage() {
        const cached = sessionStorage.getItem('tenantConfig') || localStorage.getItem('tenantConfig');
        if (cached) {
            try {
                this.configSubject.next(JSON.parse(cached));
            } catch (e) {
                this.logger.error('Failed to parse cached tenant config', e);
            }
        }
    }

    public fetchConfigFromServer(): Observable<TenantConfig | null> {
        return this.http.get<TenantConfig | { data: TenantConfig }>(`${environment.baseUrl}/tenant-settings/current`).pipe(
            map(response => ('data' in response ? response.data : response)),
            tap(config => {
                this.configSubject.next(config);
                if (localStorage.getItem('rememberMe') === 'true') {
                    localStorage.setItem('tenantConfig', JSON.stringify(config));
                } else {
                    sessionStorage.setItem('tenantConfig', JSON.stringify(config));
                }
            }),
            catchError(err => {
                this.logger.error('Failed to load tenant config', err);
                return of(null);
            })
        );
    }

    public getConfig(): TenantConfig | null {
        return this.configSubject.value;
    }

    public clearConfig() {
        this.configSubject.next(null);
        localStorage.removeItem('tenantConfig');
        sessionStorage.removeItem('tenantConfig');
    }
}
