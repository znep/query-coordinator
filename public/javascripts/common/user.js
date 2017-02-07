import _ from 'lodash';

export const isUserAdminOrPublisher = function() {
  const { currentUser } = window.serverConfig;

  if (_.isEmpty(currentUser)) {
    return false;
  }

  return _.includes(currentUser.flags, 'admin') ||
    currentUser.roleName === 'administrator' ||
    currentUser.roleName === 'publisher';
};
