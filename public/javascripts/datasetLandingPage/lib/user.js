import _ from 'lodash';

export var isUserAdminOrPublisher = function() {
  var { currentUser } = window.serverConfig;

  if (_.isEmpty(currentUser)) {
    return false;
  }

  return _.includes(currentUser.flags, 'admin') ||
    currentUser.roleName === 'administrator' ||
    currentUser.roleName === 'publisher';
};
