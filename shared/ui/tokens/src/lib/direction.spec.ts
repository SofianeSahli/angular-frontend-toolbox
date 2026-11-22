import { isRtl } from './direction';

describe('isRtl', () => {
  afterEach(() => document.documentElement.removeAttribute('dir'));

  it('reads the nearest dir attribute', () => {
    document.documentElement.dir = 'rtl';
    const wrapper = document.createElement('div');
    const inner = document.createElement('span');
    wrapper.append(inner);
    document.body.append(wrapper);
    expect(isRtl(inner)).toBe(true);
    wrapper.dir = 'ltr';
    expect(isRtl(inner)).toBe(false);
    wrapper.remove();
  });

  it('is left-to-right when no dir is set', () => {
    expect(isRtl(document.body)).toBe(false);
  });
});
