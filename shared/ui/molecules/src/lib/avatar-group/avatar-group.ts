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
  templateUrl: './avatar-group.html',
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
