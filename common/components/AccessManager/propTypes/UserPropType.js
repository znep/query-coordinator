import PropTypes from 'prop-types';
import UserAccessLevelPropType from './UserAccessLevelPropType';
import { USER_TYPES } from '../Constants';
import values from 'lodash/fp/values';

/**
 * Describes a user that comes back from the API
 */
export default PropTypes.shape({
  id: PropTypes.string,
  displayName: PropTypes.string,
  email: PropTypes.string,
  type: PropTypes.oneOf(values(USER_TYPES)),
  accessLevels: PropTypes.arrayOf(UserAccessLevelPropType)
});
