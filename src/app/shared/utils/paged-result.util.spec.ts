import { buildPageItems, clampPage, pageRange, slicePage } from './paged-result.util';

describe('paged-result.util', () => {
  it('slices a client-side page', () => {
    const items = [1, 2, 3, 4, 5, 6];
    expect(slicePage(items, 0, 4)).toEqual([1, 2, 3, 4]);
    expect(slicePage(items, 1, 4)).toEqual([5, 6]);
  });

  it('computes a 1-based visible range', () => {
    expect(pageRange(0, 10, 245)).toEqual({ start: 1, end: 10 });
    expect(pageRange(24, 10, 245)).toEqual({ start: 241, end: 245 });
    expect(pageRange(0, 10, 0)).toEqual({ start: 0, end: 0 });
  });

  it('clamps the page index', () => {
    expect(clampPage(9, 3)).toBe(2);
    expect(clampPage(-1, 3)).toBe(0);
    expect(clampPage(0, 0)).toBe(0);
  });

  it('builds compact page tokens with ellipses', () => {
    expect(buildPageItems(0, 3)).toEqual([0, 1, 2]);
    expect(buildPageItems(0, 10)).toEqual([0, 1, 'ellipsis', 9]);
    expect(buildPageItems(5, 10)).toEqual([0, 'ellipsis', 4, 5, 6, 'ellipsis', 9]);
  });
});
