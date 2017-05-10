import MostRecentlyUsed from 'common/most_recently_used';

const userId = _.get(window, 'blist.currentUserId', _.get(window, 'serverConfig.currentUser.id', null));

if (userId) {
  window.lastAccessed = new MostRecentlyUsed({ namespace: `socrata:assets:mru:${userId}` });
} else {
  window.lastAccessed = () => {}; // Ignore storing last accessed unless there is a current user
}
