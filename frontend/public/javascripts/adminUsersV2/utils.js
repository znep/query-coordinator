/**
 * Get the display name for a role
 * @param {object} role Role to get name for
 * @param {array} rolesList List of all roles, including default and custom roles
 * @param {object} I18n Translation getter thing
 */
export const getRoleDisplayName = (role, rolesList, I18n) =>
  role.isDefault ?
    I18n.t(`roles.default_roles.${role.name}.name`) :
    getCustomRoleName(role, rolesList, I18n);

/**
 * If the role is not default, but has the same name as a default role,
 * we append (Custom) to the end of it to differentiate the two
 * @param {object} customRole Custom role to get name for
 * @param {array} rolesList List of all roles, including default and custom roles
 * @param {object} I18n Translation getter thing
 */
export const getCustomRoleName = (customRole, rolesList, I18n) =>
  rolesList.some(
    otherRole => otherRole.isDefault &&
    otherRole.name.toLowerCase() === customRole.name.toLowerCase()
  ) ?
    `${customRole.name} (${I18n.t('users.roles.custom')})` :
    customRole.name;
