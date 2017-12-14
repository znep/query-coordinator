import PropTypes from 'prop-types';
import UserSearchResultPropType from '../../UserSearch/UserSearchResultPropType';

export default PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, UserSearchResultPropType]));
