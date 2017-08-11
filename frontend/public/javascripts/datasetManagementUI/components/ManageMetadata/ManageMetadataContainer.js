import { connect } from 'react-redux';
import { getCurrentColumns } from 'models/forms';
import ManageMetadata from 'components/ManageMetadata/ManageMetadata';
import _ from 'lodash';

const mapStateToProps = ({ entities }, ownProps) => {
  const outputSchemaId = parseInt(ownProps.params.outputSchemaId, 10);
  return {
    view: entities.views[ownProps.params.fourfour],
    path: ownProps.route.path,
    params: ownProps.params,
    columnsExist: !_.isEmpty(entities.output_columns),
    outputSchemaId,
    entities: entities,
    currentColumns: _.chain(getCurrentColumns(outputSchemaId, entities))
      .map(restoreColumn)
      .keyBy('id')
      .value()
  };
};

function restoreColumn(col) {
  return _.omit(col, ['transform']);
}

export default connect(mapStateToProps)(ManageMetadata);
