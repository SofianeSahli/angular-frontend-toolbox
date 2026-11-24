export function isRtl(element: Element): boolean {
  return element.closest('[dir]')?.getAttribute('dir')?.toLowerCase() === 'rtl';
}
