import _ from 'lodash';

/* Usage:
 *   assetManagerMru = new MostRecentlyUsed({ namespace: 'socrata:assets:mru', maxItems: 10 });
 *   assetManagerMru.add('four-4444');
 *   assetManagerMru.get(); // Returns all items
 *
 * Required arguments:
 *   namespace - This is the key used to store the MRU data in localStorage.
 *
 * Default arguments:
 *   maxItems - When at capacity, oldest item will be removed when new item is added.
 *   maxAge - When set() is called, items older than maxAge are be removed.
 *
 * Optional arguments:
 *   logger - A function to log that will be called in the add() function.
 */

const DEFAULT_MAX_ITEMS = 30;
const DEFAULT_MAX_AGE = 60 * 60 * 24 * 7 * 1000; // One week
const VERSION = 1.0;

export default class MostRecentlyUsed {

  constructor({ namespace, maxItems = DEFAULT_MAX_ITEMS, maxAge = DEFAULT_MAX_AGE, logger = null }) {
    if (!namespace) {
      const msg = 'A namespace argument is required.';
      console.error(msg);
      throw new Error(msg);
    }
    this.namespace = namespace;
    this.maxItems = maxItems;
    this.maxAge = maxAge;
    this.logger = logger;
  }

  _getMru() {
    try {
      return JSON.parse(localStorage.getItem(this.namespace) || '{}').content || {};
    } catch (err) {
      console.error('_getMru() encountered exception: ', err);
    }
  }

  _setMru(mru) {
    localStorage.setItem(this.namespace, JSON.stringify({ content: mru, version: VERSION }));
  }

  _timestamp() {
    return new Date().getTime();
  }

  add(uid) {
    const collection = this._getMru();

    if (this.logger) {
      this.logger(`MostRecentlyUsed.add: ${uid}`);
    }

    if (!collection[uid] && this.count() >= this.maxItems) {
      delete collection[_(collection).toPairs().minBy(1)[0]];  // Delete oldest key - minBy(1) is timestamp
    }

    collection[uid] = this._timestamp();
    this._setMru(collection);

    // Prune the collection after each additional entry.
    setTimeout(_.bindAll(this, 'removeExpiredEntries'), 1);
  }

  // Returns a list of all items in the MRU. Passing a key returns the matching item or undefined.
  get(key) {
    return arguments.length <= 0 ? this._getMru() : this._getMru()[key];  // eslint-disable-line prefer-rest-params
  }

  count() {
    return Object.keys(this._getMru()).length;
  }

  reset() {
    this._setMru({});
  }

  removeExpiredEntries() {
    const now = this._timestamp();
    const pruned = {};

    _.each(this._getMru(), (storedTimestamp, key) => {
      if (now - storedTimestamp <= this.maxAge) {
        pruned[key] = storedTimestamp;
      }
    });
    this._setMru(pruned);
  }
}
