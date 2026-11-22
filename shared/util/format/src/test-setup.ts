import '@angular/compiler';
// The app uses zone-based change detection, so tests do too (spec 001, T13).
// Angular 22 is zoneless by default: Analog's `zoneless: false` only skips
// adding zoneless mode, so zone.js is loaded here and zone change detection
// is provided explicitly (the app's Angular builder does the same).
import 'zone.js';
import 'zone.js/testing';
import '@analogjs/vitest-angular/setup-snapshots';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
import { provideZoneChangeDetection } from '@angular/core';

setupTestBed({ zoneless: false, providers: [provideZoneChangeDetection()] });
