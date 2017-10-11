import _ from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import SourceBreadcrumbs from 'components/SourceBreadcrumbs/SourceBreadcrumbs';

export const mapStateToProps = ({ entities, ui }, { atShowSource, params }) => {
  return {
    atShowSource,
    sourceId: _.toNumber(params.sourceId),
    outputSchemaId: _.toNumber(params.outputSchemaId),
    inputSchemaId: _.toNumber(params.inputSchemaId)
  };
};

export default withRouter(connect(mapStateToProps)(SourceBreadcrumbs));
