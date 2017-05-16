import MostRecentlyUsed from 'common/most_recently_used';

const userId = _.get(window, 'blist.currentUserId', // Old skool
  _.get(window, 'serverConfig.currentUser.id',  // Nu skool
    _.get(window, 'currentUser.id', null)));    // new_view

if (userId) {
  window.lastAccessed = new MostRecentlyUsed({ namespace: `socrata:assets:mru:${userId}` });
}
