import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { create } from 'qrcode';

const QUIET_ZONE = 2;

export function qrPath(text: string): { size: number; path: string } {
  const modules = create(text, { errorCorrectionLevel: 'M' }).modules;
  const parts: string[] = [];
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (modules.get(row, col)) parts.push(`M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`);
    }
  }
  return { size: modules.size + 2 * QUIET_ZONE, path: parts.join('') };
}

@Component({
  selector: 'app-qr-code',
  templateUrl: './qr-code.html',
  styleUrl: './qr-code.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.qr-code--expired]': 'expired()' },
})
export class QrCode {
  readonly text = input.required<string>();
  readonly label = input.required<string>();
  readonly expired = input(false);

  protected readonly symbol = computed(() => qrPath(this.text()));
}
