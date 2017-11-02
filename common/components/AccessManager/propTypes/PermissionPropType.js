import PropTypes from 'prop-types';
import UserPropType from './UserPropType';

/**
 * Describes a permission that comes back from the API
 */
export default PropTypes.shape({
  scope: PropTypes.oneOf(['public', 'organization', 'user']),
  'public': PropTypes.bool.isRequired,
  user: UserPropType
});
