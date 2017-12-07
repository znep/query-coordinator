import PropTypes from 'prop-types';

export default PropTypes.shape({
  displayName: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  flags: PropTypes.arrayOf(PropTypes.string), // flags, i.e. "admin" for superadmins
  rights: PropTypes.arrayOf(PropTypes.string) // rights from their domain role
});
