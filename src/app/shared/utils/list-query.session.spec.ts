import { ListQuerySession } from './list-query.session';

describe('ListQuerySession', () => {
  it('cancels a pending debounce when flushed', () => {
    jasmine.clock().install();
    const session = new ListQuerySession();
    let ran = 0;

    session.debounce(() => { ran += 1; });
    session.flush(() => { ran += 10; });
    jasmine.clock().tick(500);

    expect(ran).toBe(10);
    jasmine.clock().uninstall();
  });

  it('ignores a stale request id', () => {
    const session = new ListQuerySession();
    const first = session.beginRequest();
    const second = session.beginRequest();
    expect(session.isCurrent(first)).toBeFalse();
    expect(session.isCurrent(second)).toBeTrue();
  });
});
