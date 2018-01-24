import PropTypes from 'prop-types';
import UserAccessLevelPropType from './UserAccessLevelPropType';

/**
 * Describes a user that comes back from the API
 */
export default PropTypes.shape({
  id: PropTypes.string,
  displayName: PropTypes.string,
  email: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['user', 'interactive', 'team']),
  accessLevels: PropTypes.arrayOf(UserAccessLevelPropType)
});
