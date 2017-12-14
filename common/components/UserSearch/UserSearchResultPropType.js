import PropTypes from 'prop-types';

export const MatchesPropType = PropTypes.arrayOf(PropTypes.shape({
  field: PropTypes.oneOf(['screen_name', 'email']),
  offsets: PropTypes.arrayOf(PropTypes.shape({
    start: PropTypes.number.isRequired,
    length: PropTypes.number.isRequired
  }))
}));

export const UserPropType = PropTypes.shape({
  id: PropTypes.string,
  screen_name: PropTypes.string,
  email: PropTypes.string.isRequired,
  role_name: PropTypes.string,
  role_id: PropTypes.number,
  last_authenticated_at: PropTypes.number
});

export default PropTypes.shape({
  matches: MatchesPropType,
  user: UserPropType
});
