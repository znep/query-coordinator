import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { editView } from 'actions/views';
import { makeFieldsets } from 'models/forms';
import DatasetForm from 'components/DatasetForm/DatasetForm';

const mapStateToProps = ({ entities }, { params }) => {
  const { fourfour } = params;

  const view = entities.views[fourfour];

  const { regular: regularFieldsets, custom: customFieldsets } = makeFieldsets(view);

  return {
    regularFieldsets,
    customFieldsets
  };
};

// We don't use this much, but it is a nice alternative to using the component
// as a place to put together the output of mapStateToProps and mapDispatchToProps;
// mergeProps provides a place to do this putting-together without cluttering the
// component. For more info/background, see discussion here:
// https://github.com/reactjs/react-redux/issues/237#issuecomment-168816713
const mergeProps = ({ fourfour, ...rest }, { dispatch }, { params }) => ({
  ...rest,
  setErrors: errors => dispatch(editView(params.fourfour, { datasetMetadataErrors: errors }))
});

export default withRouter(connect(mapStateToProps, null, mergeProps)(DatasetForm));
