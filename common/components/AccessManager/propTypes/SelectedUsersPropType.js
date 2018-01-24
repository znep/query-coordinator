import PropTypes from 'prop-types';
import UserSearchResultPropType from 'common/components/UserSearch/UserSearchResultPropType';

export default PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, UserSearchResultPropType]));
