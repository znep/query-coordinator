import _ from 'lodash';

function isUserRoled() {
  const { currentUser } = window.serverConfig;

  if (_.isEmpty(currentUser)) {
    return false;
  }

  return _.trim(currentUser.roleName).length > 0;
}

function isUserAdminOrPublisher() {
  const { currentUser } = window.serverConfig;

  if (_.isEmpty(currentUser)) {
    return false;
  }

  return _.includes(currentUser.flags, 'admin') ||
    currentUser.roleName === 'administrator' ||
    currentUser.roleName === 'publisher';
}

export {
  isUserRoled,
  isUserAdminOrPublisher
};
