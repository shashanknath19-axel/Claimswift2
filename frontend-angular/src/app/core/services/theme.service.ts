import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'day' | 'night';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageKey = 'claimswift_theme';
  private readonly themeSubject = new BehaviorSubject<ThemeMode>(this.readTheme());
  readonly theme$ = this.themeSubject.asObservable();

  constructor() {
    this.applyTheme(this.themeSubject.value);
  }

  toggleTheme(): void {
    const nextTheme = this.themeSubject.value === 'day' ? 'night' : 'day';
    this.setTheme(nextTheme);
  }

  setTheme(theme: ThemeMode): void {
    this.themeSubject.next(theme);
    localStorage.setItem(this.storageKey, theme);
    this.applyTheme(theme);
  }

  getThemeSnapshot(): ThemeMode {
    return this.themeSubject.value;
  }

  private readTheme(): ThemeMode {
    const theme = localStorage.getItem(this.storageKey);
    return theme === 'night' ? 'night' : 'day';
  }

  private applyTheme(theme: ThemeMode): void {
    const className = 'theme-night';
    if (theme === 'night') {
      document.body.classList.add(className);
      return;
    }
    document.body.classList.remove(className);
  }
}
