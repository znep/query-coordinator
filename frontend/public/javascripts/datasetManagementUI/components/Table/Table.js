import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ColumnHeader from 'containers/ColumnHeaderContainer';
import TransformStatus from 'components/TransformStatus/TransformStatus';
import TableBody from 'containers/TableBodyContainer';
import * as DisplayState from 'lib/displayState';
import RowErrorsLink from 'components/RowErrorsLink/RowErrorsLink';
import styles from './Table.module.scss';

// these are the types that mean something might be vaguely geo-y. they come from clads.
// view them by doing:
// curl -XGET http://clads.app.aws-us-west-2-staging.socrata.net/models | jq '.column_type_classifier'
const geoSemanticTypes = ['zip_or_postal', 'state_or_province', 'latitude', 'longitude', 'country', 'city'];

// generate shortcut icons based on the semantic type of the input columns
function genShortcuts(column) {
  const shortcuts = [];

  if (_.find(column.inputColumns, ic => _.includes(geoSemanticTypes, ic.semantic_type))) {
    shortcuts.push('geocode');
  }

  return shortcuts;
}

class Table extends Component {
  constructor() {
    super();
    this.state = {
      dropping: null
    };

    this.setDropping = this.setDropping.bind(this);
    this.resetDropping = this.resetDropping.bind(this);
  }

  setDropping(colId) {
    this.setState({
      dropping: colId
    });
  }

  resetDropping() {
    this.setState({
      dropping: null
    });
  }

  render() {
    const {
      entities,
      params,
      inputSchema,
      outputSchema,
      outputColumns,
      displayState,
      onClickError
    } = this.props;

    const inRowErrorMode = displayState.type === DisplayState.ROW_ERRORS;
    const showFlyouts = true;
    const numRowErrors = inputSchema.num_row_errors;
    const canTransform =
      entities.sources[inputSchema.source_id] && !entities.sources[inputSchema.source_id].failed_at;

    return (
      <table className={styles.table}>
        <thead>
          <tr>
            {outputColumns.map(column => (
              <ColumnHeader
                key={column.id}
                isDropping={this.state.dropping === column.id}
                setDropping={() => this.setDropping(column.id)}
                resetDropping={this.resetDropping}
                canTransform={canTransform}
                outputSchema={outputSchema}
                outputColumn={column}
                columnCount={outputColumns.length} />
            ))}
          </tr>
          <tr className={styles.columnStatuses}>
            {outputColumns.map(column => (
              <TransformStatus
                outputSchema={outputSchema}
                key={column.id}
                params={params}
                transform={column.transform}
                displayState={displayState}
                columnId={column.id}
                isDropping={this.state.dropping === column.id}
                totalRows={inputSchema.total_rows}
                shortcuts={genShortcuts(column)}
                flyouts={showFlyouts}
                onClickError={() => onClickError(params, column.transform, displayState)} />
            ))}
          </tr>
          {numRowErrors > 0 && (
            <RowErrorsLink
              params={params}
              displayState={displayState}
              numRowErrors={numRowErrors}
              inRowErrorMode={inRowErrorMode} />
          )}
        </thead>
        <TableBody
          entities={entities}
          columns={outputColumns}
          displayState={displayState}
          dropping={this.state.dropping}
          inputSchemaId={inputSchema.id} />
      </table>
    );
  }
}

Table.propTypes = {
  entities: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  inputSchema: PropTypes.object.isRequired,
  outputSchema: PropTypes.object.isRequired,
  displayState: PropTypes.object.isRequired,
  onClickError: PropTypes.func.isRequired,
  outputColumns: PropTypes.arrayOf(
    PropTypes.shape({
      position: PropTypes.number.isRequired,
      field_name: PropTypes.string.isRequired,
      display_name: PropTypes.string.isRequired,
      description: PropTypes.string,
      transform_id: PropTypes.number.isRequired,
      transform: PropTypes.shape({
        attempts: PropTypes.number.isRequired,
        error_indices: PropTypes.array,
        id: PropTypes.number.isRequired,
        output_soql_type: PropTypes.string.isRequired,
        transform_expr: PropTypes.string.isRequired,
        transform_input_columns: PropTypes.array.isRequired
      })
    })
  )
};

export default Table;
