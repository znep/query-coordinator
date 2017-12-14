import PropTypes from 'prop-types';
import UserSearchResultPropType from './UserSearchResultPropType';

export default PropTypes.shape({
  results: PropTypes.arrayOf(UserSearchResultPropType)
});
