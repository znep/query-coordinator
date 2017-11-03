import PropTypes from 'prop-types';

/**
 * Describes an "audience scope"; used mainly for the AudienceLabel component
 */
export default PropTypes.oneOf(['private', 'public', 'organization']);
