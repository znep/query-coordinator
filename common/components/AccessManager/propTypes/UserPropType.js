import PropTypes from 'prop-types';

/**
 * Describes a user that comes back from the API
 */
export default PropTypes.shape({
  id: PropTypes.string.isRequired,
  displayName: PropTypes.string.isRequired,
  email: PropTypes.string // core doens't return this... yet
});
