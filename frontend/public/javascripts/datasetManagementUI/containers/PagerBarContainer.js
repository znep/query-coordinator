import { connect } from 'react-redux';
import { browserHistory, withRouter } from 'react-router';
import * as DisplayState from 'lib/displayState';
import * as Selectors from 'selectors';
import PagerBar from 'components/PagerBar/PagerBar';

function numItemsToPaginate(entities, outputSchemaId, displayState) {
  switch (displayState.type) {
    case DisplayState.COLUMN_ERRORS:
      return entities.transforms[displayState.transformId].num_transform_errors;

    case DisplayState.ROW_ERRORS: {
      const outputSchema = entities.output_schemas[outputSchemaId];
      return entities.input_schemas[outputSchema.input_schema_id].num_row_errors;
    }
    case DisplayState.NORMAL: {
      const columns = Selectors.columnsForOutputSchema(entities, outputSchemaId);
      return Selectors.rowsTransformed(columns);
    }
    default:
      console.error('unknown display state', displayState.type);
  }
}

function mapDispatchToProps(dispatch, ownProps) {
  const { displayState, path, params } = ownProps;

  const urlForPage = targetPage => {
    const targetDisplayState = { ...displayState, pageNo: targetPage };
    const targetPageUrl = DisplayState.toUiUrl(path, params, targetDisplayState);

    return targetPageUrl;
  };

  const changePage = targetPage => {
    if (targetPage) {
      browserHistory.push(urlForPage(targetPage));
    }
  };

  return { urlForPage, changePage };
}

function mapStateToProps({ entities }, ownProps) {
  const currentPage = ownProps.displayState.pageNo;
  const resultCount = numItemsToPaginate(entities, ownProps.path.outputSchemaId, ownProps.displayState);

  return { currentPage, resultCount };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PagerBar));
