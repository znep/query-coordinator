import PropTypes from 'prop-types';
import UserPropType from './UserPropType';
import AccessLevelPropType from './AccessLevelPropType';
import AudienceScopePropType from './AudienceScopePropType';

/**
 * Describes the permissions that comes back from the API
 */
export default PropTypes.shape({
  scope: AudienceScopePropType,
  accessLevels: PropTypes.arrayOf(AccessLevelPropType),
  users: PropTypes.arrayOf(UserPropType)
});
