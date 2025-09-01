import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  base = 'https://countriesnow.space/api/v0.1/countries';

  constructor(private http: HttpClient) {}

  // Get list of countries
  getCountries() {
    return this.http.get<{ data: { name: string }[] }>(`${this.base}/positions`);
  }

  // Get states of a selected country
  getStates(country: string) {
    return this.http.post<{ data: { name: string }[] }>(
      `${this.base}/states`,
      { country }
    );
  }

  // Get cities of a selected state and country
  getCities(country: string, state: string) {
    return this.http.post<{ data: string[] }>(
      `${this.base}/state/cities`,
      { country, state }
    );
  }
}
