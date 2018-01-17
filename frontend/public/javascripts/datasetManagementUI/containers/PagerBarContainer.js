import _ from 'lodash';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import * as DisplayState from 'lib/displayState';
import * as Selectors from 'selectors';
import * as FlashActions from 'reduxStuff/actions/flashMessage';
import PagerBar from 'components/PagerBar/PagerBar';

function numItemsToPaginate(entities, outputSchemaId, displayState) {
  switch (displayState.type) {
    case DisplayState.COLUMN_ERRORS:
      return entities.transforms[displayState.transformId].error_count;

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
  const { displayState, params } = ownProps;

  const urlForPage = targetPage => {
    const targetDisplayState = { ...displayState, pageNo: targetPage };
    const targetPageUrl = DisplayState.toUiUrl(params, targetDisplayState);

    return targetPageUrl;
  };

  const changePage = targetPage => {
    if (targetPage) {
      dispatch(FlashActions.hideFlashMessage());
      browserHistory.push(urlForPage(targetPage));
    }
  };

  return { urlForPage, changePage };
}

function mapStateToProps({ entities, ui }, ownProps) {
  const currentPage = ownProps.displayState.pageNo;
  const resultCount = numItemsToPaginate(
    entities,
    _.toNumber(ownProps.params.outputSchemaId),
    ownProps.displayState
  );

  const isLoading = Selectors.rowLoadOperationsInProgress(ui.apiCalls) > 0;

  return { currentPage, resultCount, isLoading };
}

export default connect(mapStateToProps, mapDispatchToProps)(PagerBar);
