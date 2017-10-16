import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import URLSource from 'components/URLSource/URLSource';
import * as Actions from 'reduxStuff/actions/createSource';

const mergeProps = (stateProps, { dispatch }, { params }) => ({
  createURLSource: url => dispatch(Actions.createURLSource(url, params))
});

export default withRouter(connect(null, null, mergeProps)(URLSource));
