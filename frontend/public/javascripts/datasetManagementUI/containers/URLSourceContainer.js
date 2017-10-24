import _ from 'lodash';
import { connect } from 'react-redux';
import URLSource from 'components/URLSource/URLSource';
import * as Actions from 'reduxStuff/actions/createSource';
import * as Selectors from 'selectors';

const mapStateToProps = ({ entities }, { params }) => {
  const rev = Selectors.currentRevision(entities, _.toNumber(params.revisionSeq));

  return {
    hrefExists: !!rev.href.length
  };
};

const mergeProps = (stateProps, { dispatch }, { params }) => ({
  createURLSource: url => dispatch(Actions.createURLSource(url, params)),
  ...stateProps
});

export default connect(mapStateToProps, null, mergeProps)(URLSource);
