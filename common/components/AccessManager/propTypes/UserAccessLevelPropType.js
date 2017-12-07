import PropTypes from 'prop-types';

export default PropTypes.shape({
  name: PropTypes.oneOf(['viewer', 'contributor', 'owner', 'current_owner']),
  version: PropTypes.oneOf(['all', 'published', 'draft'])
});
