import { Group, GroupDto, Leaf, LeafDto, Top, TopDto } from './models';

export function toLeaf(dto: LeafDto): Leaf {
  return {
    code: dto.code,
    key: dto.translation_key,
    emoji: dto.emoji,
    retired: dto.retired,
    isOther: dto.is_other,
  };
}

export function toGroup(dto: GroupDto): Group {
  return {
    code: dto.code,
    key: dto.translation_key,
    emoji: dto.emoji,
    retired: dto.retired,
    leaves: dto.leaves.map(toLeaf),
  };
}

export function toTop(dto: TopDto): Top {
  return {
    code: dto.code,
    key: dto.translation_key,
    emoji: dto.emoji,
    type: dto.type,
    retired: dto.retired,
    groups: dto.groups.map(toGroup),
  };
}
