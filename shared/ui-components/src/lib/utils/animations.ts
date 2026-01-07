import {
  animate,
  group,
  keyframes,
  query,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
export const slideInAnimation = trigger('listAnimation', [
  transition('* <=> *', [
    query(
      ':leave',
      [
        style({ position: 'absolute', width: '100%' }),
        animate(
          '300ms ease-in',
          style({ opacity: 0, transform: 'translateX(-100%)' })
        ),
      ],
      { optional: true }
    ),
    query(
      ':enter',
      [
        style({ opacity: 0, transform: 'translateX(100%)' }),
        animate(
          '300ms ease-out',
          style({ opacity: 1, transform: 'translateX(0)' })
        ),
      ],
      { optional: true }
    ),
  ]),
]);

export const slideFade = trigger('slideFade', [
  state(
    'hidden',
    style({
      height: '0px',
    })
  ),
  state('visible', style({ height: '*' })),
  transition('hidden => visible', animate('500ms ease-out')),
  transition('visible => hidden', animate('500ms ease-in')),
]);

export const blinkDiv = trigger('highlightBlink', [
  state(
    'false',
    style({
      border: '2px solid transparent',
      borderRadius: '10px',
    })
  ),
  state(
    'true',
    style({
      border: '2px solid transparent',
      borderRadius: '10px',
    })
  ),
  transition('false => true', [
    animate(
      '1s ease-in-out',
      keyframes([
        style({ borderColor: 'transparent', offset: 0 }),
        style({ borderColor: 'rgba(255,255,0,0.8)', offset: 0.25 }),
        style({ borderColor: 'transparent', offset: 0.5 }),
        style({ borderColor: 'rgba(255,255,0,0.8)', offset: 0.75 }),
        style({ borderColor: 'transparent', offset: 1 }),
      ])
    ),
  ]),
]);

export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    query(
      ':enter, :leave',
      style({
        position: 'absolute',
        width: '100%',
        height: '100%',
        backfaceVisibility: 'hidden',
      }),
      { optional: true }
    ),
    group([
      query(
        ':leave',
        [
          style({ transform: 'rotateY(0deg)', opacity: 1 }),
          animate(
            '500ms ease-in-out',
            style({ transform: 'rotateY(-90deg)', opacity: 0 })
          ),
        ],
        { optional: true }
      ),
      query(
        ':enter',
        [
          style({ transform: 'rotateY(90deg)', opacity: 0 }),
          animate(
            '500ms ease-in-out',
            style({ transform: 'rotateY(0deg)', opacity: 1 })
          ),
        ],
        { optional: true }
      ),
    ]),
  ]),
]);

export const expandCollapse = trigger('expandCollapse', [
  state(
    'collapsed',
    style({
      height: '0px',
      opacity: 0,
      overflow: 'hidden',
    })
  ),
  state(
    'expanded',
    style({
      height: '*', // auto height
      opacity: 1,
      overflow: 'hidden',
    })
  ),
  transition('collapsed <=> expanded', [animate('300ms ease-in-out')]),
]);

export const listStaggerAnimation = trigger('listStaggerAnimation', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(10px)' }),
    animate(
      '300ms ease-out',
      style({ opacity: 1, transform: 'translateY(0)' })
    ),
  ]),
  transition(':leave', [
    animate(
      '300ms ease-in',
      style({ opacity: 0, transform: 'translateY(-10px)' })
    ),
  ]),
]);
