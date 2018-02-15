import { connect as reduxConnect } from 'react-redux';
import connectLocalization from 'common/i18n/components/connectLocalization';
import flow from 'lodash/fp/flow';

export { I18nPropType } from 'common/i18n/components/connectLocalization';

/** Utility function that combines localization and redux store, making sure to add the localization
 * first so it can be used in mapStateToProps/mapDispatchToProps
 * @param mapStateToProps
 * @param mapDispatchToProps
 * @returns {*}
 */
export const connect = (mapStateToProps, mapDispatchToProps) => flow(
  reduxConnect(mapStateToProps, mapDispatchToProps),
  connectLocalization
);

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
