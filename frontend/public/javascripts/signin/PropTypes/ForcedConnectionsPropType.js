import PropTypes from 'prop-types';

// used to force certain regex-passing emails to go to specific connections
// will override any set email domain associations
export default PropTypes.shape({
  // regex string to match emails on
  match: PropTypes.string.isRequired,

  // actual auth0 connection name to login with
  connection: PropTypes.string.isRequired
});
