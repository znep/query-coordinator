import PropTypes from 'prop-types';

// This is what we get back from Auth0 when getting the list of connections
export default PropTypes.shape({
  // the "email domain" associated with the connection
  domain_aliases: PropTypes.arrayOf(PropTypes.string),

  // the actual connection name used to login
  name: PropTypes.string.isRequired,

  // whether or not this connection is enabled
  status: PropTypes.bool.isRequired
});
