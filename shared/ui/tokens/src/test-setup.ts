import '@angular/compiler';
// Angular 22 defaults to zoneless and Analog's `zoneless: false` does not add zone.js back.
import 'zone.js';
import 'zone.js/testing';
import '@analogjs/vitest-angular/setup-snapshots';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
import { provideZoneChangeDetection } from '@angular/core';

setupTestBed({ zoneless: false, providers: [provideZoneChangeDetection()] });
