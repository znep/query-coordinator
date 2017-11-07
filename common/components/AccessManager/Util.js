
/** Returns whether the given permission is a "public" permission */
export const isPublicPermission = (permission) => (
  (permission.public || permission.scope === 'public') && (permission.type === 'read' || permission.type === 'write')
);

/** Returns whether the given permission is an "organization" permission */
export const isOrganizationPermission = (permission) => (
  permission.scope === 'organization' && permission.type === 'read'
);

/**
 * Gets the "audience scope" of an asset given a list of permissions.
 * @param {array} permissions List of permissions for the current asset from the API
 */
export const getAudienceScopeFromPermissions = (permissions) => {
  if (!permissions) {
    return null;
  }

  if (permissions.some(isPublicPermission)) {
    return 'public';
  } else if (permissions.some(isOrganizationPermission)) {
    return 'organization';
  }

  // currently, the dataset being private is just denoted by the absence
  // of the "public read" permission, so we default to private
  return 'private';
};

/**
 * Pivots the list of individual permissions into a list of users and their individual permissions
 * for the asset. Filters out any non-user-specific rights as well.
 * @param {array} permissions List of permissions for the current asset from the API
 */
export const getUsersFromPermissions = (permissions) => {
  const users = [];

  permissions.forEach(permission => {
    if (permission.user) {
      let userIndex = users.findIndex(user => user.id === permission.user.id);

      if (userIndex === -1) {
        // user hasn't been found yet, add them to the list
        users.push({
          ...permission.user,
          permissions: [permission.type]
        });
      } else {
        // user has already been added; just update the permissions array
        const user = users[userIndex];
        users[userIndex] = {
          ...user,
          permissions: [...user.permissions, permission.type]
        };
      }
    }
  });

  return users;
};
