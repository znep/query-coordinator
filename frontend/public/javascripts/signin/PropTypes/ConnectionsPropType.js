import PropTypes from 'prop-types';

// this is what gets set in the internal panel to add specific buttons for choosing
// connections to the login screen (the "ChooseConnection" component)
export default PropTypes.shape({
  // if this is set, the button renders as `Sign in with ${name}`
  name: PropTypes.string,

  // if this is set, the buttons renders with just this text
  // (only name or buttonText should be set)
  buttonText: PropTypes.string,

  // the actual auth0 connection used to login
  connection: PropTypes.string.isRequired,

  // the image to put on the button; if this is blank, no image
  image: PropTypes.string
});
