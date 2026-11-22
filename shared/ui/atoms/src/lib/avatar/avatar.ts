import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, linkedSignal, numberAttribute } from '@angular/core';

export type UiAvatarSize = 'sm' | 'md' | 'lg';
export type UiAvatarMember = 1 | 2 | 3;

@Component({
  selector: 'ui-avatar',
  template: `@if (showPhoto()) {
      <img [src]="src()" alt="" (error)="photoFailed.set(true)" />
    } @else {
      {{ initial() }}
    }`,
  styleUrl: './avatar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ui-avatar--sm]': 'size() === "sm"',
    '[class.ui-avatar--lg]': 'size() === "lg"',
    '[class.ui-avatar--member-2]': 'member() === 2',
    '[class.ui-avatar--member-3]': 'member() === 3',
    '[attr.role]': 'decorative() ? null : "img"',
    '[attr.aria-label]': 'decorative() ? null : name()',
    '[attr.aria-hidden]': 'decorative() ? "true" : null',
  },
})
export class UiAvatar {
  readonly name = input.required<string>();
  readonly src = input<string>();
  readonly size = input<UiAvatarSize>('md');
  readonly member = input<UiAvatarMember, unknown>(1, { transform: (value) => numberAttribute(value, 1) as UiAvatarMember });
  readonly decorative = input(false, { transform: booleanAttribute });

  protected readonly photoFailed = linkedSignal({ source: this.src, computation: () => false });
  protected readonly showPhoto = computed(() => !!this.src() && !this.photoFailed());
  protected readonly initial = computed(() => Array.from(this.name().trim())[0]?.toLocaleUpperCase('fr') ?? '');
}
