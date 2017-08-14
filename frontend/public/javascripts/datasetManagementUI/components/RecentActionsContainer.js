import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import RecentActions from 'components/RecentActions';

const mapStateToProps = ({ entities }) => ({
  entities
});

export default withRouter(connect(mapStateToProps)(RecentActions));
