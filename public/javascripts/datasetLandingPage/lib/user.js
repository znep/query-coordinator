import _ from 'lodash';

export var isUserAdminOrPublisher = function() {
  var { currentUser } = window.serverConfig;

  if (_.isEmpty(currentUser)) {
    return false;
  }

  return _.contains(currentUser.flags, 'admin') ||
    currentUser.roleName === 'administrator' ||
    currentUser.roleName === 'publisher';
};
