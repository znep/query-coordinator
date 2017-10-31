import { connect } from 'react-redux';
import _ from 'lodash';
import { browserHistory } from 'react-router';
import { currentAndIgnoredOutputColumns } from 'selectors';
import * as DisplayState from 'lib/displayState';
import * as Links from 'links/links';
import Table from 'components/Table/Table';

const combineAndSort = ({ current, ignored }) => _.sortBy([...current, ...ignored], 'position');

// TODO: this is wrong...this only gets a single input column....not all
const getInputColumns = (entities, outputColumns) =>
  outputColumns.map(outputColumn => {
    const inputColumns = outputColumn.transform.transform_input_columns.map(
      ic => entities.input_columns[ic.input_column_id]
    );

    return {
      ...outputColumn,
      inputColumns
    };
  });

// TODO: we currently don't handle the case where currentAndIgnoredOutputColumns
// fails; should probably redirect or display some message to the user
const mapStateToProps = ({ entities }, { path, inputSchema, outputSchema, displayState, showShortcut }) => {
  return {
    entities,
    path,
    inputSchema,
    outputSchema,
    displayState,
    showShortcut,
    outputColumns: getInputColumns(
      entities,
      combineAndSort(currentAndIgnoredOutputColumns(entities, outputSchema.id))
    )
  };
};

const mergeProps = (stateProps, { dispatch }, ownProps) => {
  const dispatchProps = {
    onClickError: (path, transform, displayState) => {
      const linkPath = DisplayState.inErrorMode(displayState, transform)
        ? Links.showOutputSchema(path, path.sourceId, path.inputSchemaId, path.outputSchemaId)
        : Links.showColumnErrors(path, path.sourceId, path.inputSchemaId, path.outputSchemaId, transform.id);

      browserHistory.push(linkPath);
    }
  };

  return { ...stateProps, ...dispatchProps, ...ownProps };
};

export default connect(mapStateToProps, null, mergeProps)(Table);
