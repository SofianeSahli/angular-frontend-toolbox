import { ChangeDetectionStrategy, Component, computed, input, numberAttribute } from '@angular/core';
import { UiAvatar, UiAvatarMember } from '@shared/ui-atoms';

export interface UiAvatarGroupMember {
  readonly name: string;
  readonly src?: string;
  readonly member?: UiAvatarMember;
}

export type UiAvatarGroupSize = 'sm' | 'md';

@Component({
  selector: 'ui-avatar-group',
  imports: [UiAvatar],
  template: `@for (person of visible(); track $index) {
      <ui-avatar decorative [name]="person.name" [src]="person.src" [member]="person.member ?? 1" [size]="size()" />
    }
    @if (hiddenCount() > 0) {
      <span class="ui-avatar-group__more" [class.ui-avatar-group__more--sm]="size() === 'sm'" aria-hidden="true">+{{ hiddenCount() }}</span>
    }`,
  styleUrl: './avatar-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'img',
    '[attr.aria-label]': 'accessibleName()',
  },
})
export class UiAvatarGroup {
  readonly members = input.required<readonly UiAvatarGroupMember[]>();
  readonly max = input(3, { transform: numberAttribute });
  readonly size = input<UiAvatarGroupSize>('sm');

  protected readonly visible = computed(() => this.members().slice(0, this.max()));
  protected readonly hiddenCount = computed(() => Math.max(this.members().length - this.max(), 0));
  protected readonly accessibleName = computed(() => this.members().map((person) => person.name).join(', '));
}
