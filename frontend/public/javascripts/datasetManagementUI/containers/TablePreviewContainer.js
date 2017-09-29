import { connect } from 'react-redux';
import TablePreview from 'components/TablePreview/TablePreview';
import * as Actions from 'reduxStuff/actions/sources';

function mapStateToProps({ entities }, { params }) {
  return {
    view: entities.views[params.fourfour],
    entities,
    params
  };
}

function mapDispatchToProps(dispatch) {
  return {
    createUpload: (file, params) => {
      dispatch(Actions.createUploadSource(file, params));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(TablePreview);
