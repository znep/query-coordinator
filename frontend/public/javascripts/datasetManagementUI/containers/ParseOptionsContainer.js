import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import ParseOptions from 'datasetManagementUI/components/ParseOptions/ParseOptions';
import _ from 'lodash';
import { setFormState, markFormClean, markFormDirty } from 'datasetManagementUI/reduxStuff/actions/forms';

const FORM_NAME = 'parseOptionsForm';

const mapStateToProps = ({ entities, ui: { forms: { parseOptionsForm } } }, { params }) => {
  const source = entities.sources[_.toNumber(params.sourceId)];
  return {
    source,
    form: {
      parseOptions: source.parse_options,
      errors: {},
      ...parseOptionsForm.state
    }
  };
};

const mergeProps = (stateProps, { dispatch }, ownProps) => ({
  ...ownProps,
  ...stateProps,
  setFormState: (state) => {

    if (_.isEqual(state.parseOptions, stateProps.source.parse_options)) {
      dispatch(markFormClean(FORM_NAME));
    } else {
      dispatch(markFormDirty(FORM_NAME));
    }

    dispatch(setFormState(FORM_NAME, state));
  }
});

export default withRouter(connect(mapStateToProps, null, mergeProps)(ParseOptions));
