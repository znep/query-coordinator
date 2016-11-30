import { PropTypes } from 'react';

// This is what we get back from Auth0 when getting the list of connections
export default PropTypes.shape({
  // the "email domain" associated with the connection
  domain: PropTypes.string,

  // the actual connection name used to login
  name: PropTypes.string.isRequired,

  // whether or not this connection is enabled
  status: PropTypes.bool.isRequired
});
