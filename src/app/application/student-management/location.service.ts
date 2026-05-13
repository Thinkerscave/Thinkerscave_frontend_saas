import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

export interface CountryItem {
  name: string;
}

export interface StateItem {
  name: string;
  state_code: string;
}

export interface CityItem {
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  private base = 'https://countriesnow.space/api/v0.1/countries';

  constructor(private http: HttpClient) {}

  /** Returns a flat sorted list of country names */
  getCountryNames(): Observable<string[]> {
    return this.http.get<{ data: { name: string }[] }>(`${this.base}/positions`).pipe(
      map(res => res.data.map(c => c.name).sort())
    );
  }

  /**
   * Returns list of states for a country.
   * API shape: { data: { name, iso2, iso3, states: [{ name, state_code }] } }
   */
  getStates(country: string): Observable<StateItem[]> {
    return this.http.post<{ data: { name: string; states: StateItem[] } }>(
      `${this.base}/states`,
      { country }
    ).pipe(
      map(res => res?.data?.states ?? [])
    );
  }

  /**
   * Returns list of cities as plain strings, mapped to { name } objects.
   * API shape: { data: string[] }
   */
  getCities(country: string, state: string): Observable<CityItem[]> {
    return this.http.post<{ data: string[] }>(
      `${this.base}/state/cities`,
      { country, state }
    ).pipe(
      map(res => (res?.data ?? []).map(city => ({ name: city })))
    );
  }
}
