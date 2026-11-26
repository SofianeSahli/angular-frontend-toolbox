import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, computed, inject, input } from '@angular/core';
import { UiIcon } from '@shared/ui-atoms';
import { UiToast, UiToastItem } from '../toast.service';

const TONE_ICONS: Readonly<Record<UiToastItem['tone'], string | null>> = {
  neutral: null,
  success: 'circle-check',
  danger: 'circle-x',
};

@Component({
  selector: 'ui-toast',
  imports: [UiIcon],
  templateUrl: './toast-view.html',
  styleUrl: './toast-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': 'toast().tone === "danger" ? "alert" : "status"',
    '[class]': '"ui-toast--" + toast().tone',
    '(mouseenter)': 'pause()',
    '(mouseleave)': 'resumeIfIdle()',
    '(focusin)': 'pause()',
    '(focusout)': 'resumeIfIdle()',
  },
})
export class UiToastView implements OnInit {
  readonly toast = input.required<UiToastItem>();

  private readonly service = inject(UiToast);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  protected readonly icon = computed(() => TONE_ICONS[this.toast().tone]);

  private remainingMs = 0;
  private startedAt = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  ngOnInit(): void {
    this.remainingMs = this.toast().duration;
    this.resume();
  }

  protected pause(): void {
    if (this.timer === undefined) return;
    clearTimeout(this.timer);
    this.timer = undefined;
    this.remainingMs -= Date.now() - this.startedAt;
  }

  protected resumeIfIdle(): void {
    queueMicrotask(() => {
      if (!this.host.matches(':hover') && !this.host.contains(this.host.ownerDocument.activeElement)) this.resume();
    });
  }

  protected runAction(): void {
    this.toast().action?.run();
    this.service.dismiss(this.toast().id);
  }

  private resume(): void {
    if (this.timer !== undefined) return;
    this.startedAt = Date.now();
    this.timer = setTimeout(() => this.service.dismiss(this.toast().id), Math.max(this.remainingMs, 0));
  }
}
