import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private themeKey = 'theme';

  constructor() {
    const savedTheme = localStorage.getItem(this.themeKey) || 'light';
    this.setTheme(savedTheme);
  }

  toggleTheme() {
    const current = document.body.getAttribute('data-bs-theme') || 'light';
    const newTheme = current === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  private setTheme(theme: string) {
    localStorage.setItem(this.themeKey, theme);
    document.body.setAttribute('data-bs-theme', theme);
  }

  isLight(): boolean {
    return (document.body.getAttribute('data-bs-theme') || 'light') === 'light';
  }
}
