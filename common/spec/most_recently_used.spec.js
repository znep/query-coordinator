import MostRecentlyUsed from 'common/most_recently_used';

describe('most_recently_used', () => {
  const mru = new MostRecentlyUsed({
    namespace: 'test:namespace',
    maxItems: 30,
    maxAge: 10
  });

  const originalDateFunction = window.Date;

  const unStubDate = () => window.Date = originalDateFunction;

  const stubDate = (value) => {
    window.Date = () => { return { getTime: () => value }; };
    window.Date.now = () => value;
  };

  beforeEach(() => mru.reset());

  it('requires a namespace', () => {
    assert.throws(() => {
      new MostRecentlyUsed();
    });
  });

  it('adds an item', () => {
    const key = 'abcd-1234';
    mru.add(key);
    assert(mru.get()[key], `expected to find item in MRU with key: ${key}`);
  });

  describe('fscking with time', () => {

    after(unStubDate);

    it('deletes the oldest item during add() when at maximum capacity', () => {
      const oldestKey = 'olde-tyme';

      stubDate(1000);
      mru.add(oldestKey);

      stubDate(2000);
      for (let i = 0; i < mru.maxItems - 1; i++) {
        mru.add(i);
      }
      assert.equal(mru.maxItems, mru.count());
      assert(mru.get(oldestKey));
      assert.equal(mru.count(), mru.maxItems, 'expected MRU to be at maximum capacity');
      mru.add('last-strw');
      assert.equal(mru.count(), mru.maxItems, 'expected MRU to be at maximum capacity');
      assert.isUndefined(mru.get(oldestKey), `expected not to find oldest key in MRU: ${oldestKey}`);
    });

    it('adds a given item once and updates the timestamp if already extant', () => {
      const key = 'abcd-efgh';
      stubDate(1000);
      mru.add(key);
      assert.equal(mru.count(), 1, 'expected there to be one item in MRU');
      const last = mru.get(key);
      stubDate(2000);
      mru.add(key);
      assert.equal(mru.count(), 1, 'expected there to be one item in MRU');
      assert.notEqual(mru.get(key), last, 'expected timestamp to have been updated');
    });

    it('removes old entries on purge()', () => {
      stubDate(1000);
      mru.add('olde-cogr');
      assert.equal(mru.count(), 1, 'expected there to be on item in MRU');
      stubDate(2000);
      mru.add('beef-cake');
      assert.equal(mru.count(), 2, 'expected there to be two items in MRU');
      mru.removeExpiredEntries();
      assert.equal(mru.count(), 1, 'expected there to be one item in MRU');
      assert.isUndefined(mru.get('olde-cogr'), 'did not expect to find key: olde-cogr');
      assert(mru.get('beef-cake'), 'expected to find key: beef-cake');
    });
  });

  it('removes all items when reset', () => {
    mru.add('1234-1234');
    mru.add('abcd-abcd');
    assert.equal(mru.count(), 2, 'expected there to be two items in MRU');
    mru.reset();
    assert.equal(mru.count(), 0, 'expected MRU to be empty');
  });

  it('returns the number of items', () => {
    mru.add('foob-aaar');
    assert.equal(mru.count(), 1, 'expected there to be one item in MRU');
    mru.add('barb-azzz');
    assert.equal(mru.count(), 2, 'expected there to be two items in MRU');
  });

  it('returns all items added', () => {
    mru.add('feed-face');
    mru.add('fake-beef');
    assert.property(mru.get(), 'feed-face', 'expected to find missing key: feed-face');
    assert.property(mru.get(), 'fake-beef', 'expected to to find missing key: fake-beef');
  });

  it('returns the sorted keys of the items', () => {
    stubDate(1);
    mru.add('feed-face');
    stubDate(10);
    mru.add('fake-beef');
    assert.deepEqual(mru.keys(), ['fake-beef', 'feed-face']);
  });

  it('catches and logs JSON parse errors', () => {
    let called;
    let message;
    const originalConsole = window.console;
    const spy = { error: (msg) => { called = true; message = msg; } };
    const brokenNamespace = 'test:namespace:broken';
    const brokenMru = new MostRecentlyUsed({ namespace: brokenNamespace });

    window.console = spy;
    window.localStorage.setItem(brokenNamespace, 'invalid json');
    brokenMru.get();
    window.console = originalConsole;
    assert(called, 'expected console.error spy should have been called');
    assert(message !== '', 'expected to have captured a logged error message');
  });

  it('uses the logger when present', () => {
    let called;
    let message;
    const logger = (msg) => { called = true; message = msg; };
    new MostRecentlyUsed({ namespace: 'logger test', logger: logger }).add('logg-meee');
    assert(called);
    assert.equal('MostRecentlyUsed.add: uid = logg-meee', message);
  });
});
