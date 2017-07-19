import _ from 'lodash';

function isUserRoled() {
  const { currentUser } = window.serverConfig;

  if (_.isEmpty(currentUser)) {
    return false;
  }

  return isUserSuperadmin() ||
    _.trim(currentUser.roleName).length > 0;
}

function isUserSuperadmin() {
  const { currentUser } = window.serverConfig;

  if (_.isEmpty(currentUser)) {
    return false;
  }

  return _.includes(currentUser.flags, 'admin');
}

function userHasRight(right) {
  const { currentUser } = window.serverConfig;

  if (_.isEmpty(currentUser) || _.isEmpty(right)) {
    return false;
  }

  return isUserSuperadmin() ||
    _.includes(currentUser.rights, right);
}

export {
  isUserRoled,
  userHasRight,
  isUserSuperadmin
};
