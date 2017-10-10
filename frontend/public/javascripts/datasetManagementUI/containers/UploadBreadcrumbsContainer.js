import _ from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import UploadBreadcrumbs from 'components/UploadBreadcrumbs/UploadBreadcrumbs';

export const mapStateToProps = ({ entities, ui }, { atShowUpload, params }) => {
  return {
    atShowUpload,
    sourceId: _.toNumber(params.sourceId),
    outputSchemaId: _.toNumber(params.outputSchemaId),
    inputSchemaId: _.toNumber(params.inputSchemaId)
  };
};

export default withRouter(connect(mapStateToProps)(UploadBreadcrumbs));
