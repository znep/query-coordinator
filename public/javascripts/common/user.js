import _ from 'lodash';

function isUserRoled() {
  const { currentUser } = window.serverConfig;

  if (_.isEmpty(currentUser)) {
    return false;
  }

  return isUserSuperadmin() ||
    _.trim(currentUser.roleName).length > 0;
}

function isUserAdminOrPublisher() {
  const { currentUser } = window.serverConfig;

  if (_.isEmpty(currentUser)) {
    return false;
  }

  return isUserSuperadmin() ||
    currentUser.roleName === 'administrator' ||
    currentUser.roleName === 'publisher';
}

function isUserSuperadmin() {
  const { currentUser } = window.serverConfig;

  if (_.isEmpty(currentUser)) {
    return false;
  }

  return _.includes(currentUser.flags, 'admin');
}

export {
  isUserRoled,
  isUserAdminOrPublisher,
  isUserSuperadmin
};
