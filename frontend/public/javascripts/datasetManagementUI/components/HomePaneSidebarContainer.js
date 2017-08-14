import _ from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import HomePaneSidebar from 'components/HomePaneSidebar';

const mapStateToProps = ({ entities }) => ({
  entities,
  columnsExist: !_.isEmpty(entities.output_columns)
});

export default withRouter(connect(mapStateToProps)(HomePaneSidebar));
