import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import * as DisplayState from '../../lib/displayState';
import { PAGE_SIZE } from '../../actions/loadData';
import * as Selectors from '../../selectors';

function numItemsToPaginate(db, outputSchemaId, displayState) {
  switch (displayState.type) {
    case DisplayState.COLUMN_ERRORS:
      return db.transforms[displayState.transformId].num_transform_errors;

    case DisplayState.ROW_ERRORS: {
      const outputSchema = db.output_schemas[outputSchemaId];
      return db.input_schemas[outputSchema.input_schema_id].num_row_errors;
    }
    case DisplayState.NORMAL: {
      const columns = Selectors.columnsForOutputSchema(db, outputSchemaId);
      return Selectors.rowsTransformed(columns);
    }
    default:
      console.error('unknown display state', displayState.type);
  }
}

function Pager({ path, displayState, numPages }) {
  const prevDisplayState = (displayState.pageNo > 0) ?
    { ...displayState, pageNo: displayState.pageNo - 1 } :
    null;
  const nextDisplayState = (displayState.pageNo < numPages - 1) ?
    { ...displayState, pageNo: displayState.pageNo + 1 } :
    null;
  const prevPageLink = prevDisplayState ?
    <Link to={DisplayState.toUiUrl(path, prevDisplayState)}>&lt;</Link> :
    (<span>&lt;</span>);
  const nextPageLink = nextDisplayState ?
    <Link to={DisplayState.toUiUrl(path, nextDisplayState)}>&gt;</Link> :
    (<span>&gt;</span>);

  if (_.isNaN(numPages)) {
    return <div></div>;
  } else {
    return (
      <div>
        {prevPageLink}
        {displayState.pageNo + 1} of {Math.max(numPages, displayState.pageNo + 1)}
        {nextPageLink}
      </div>
    );
  }
}

Pager.propTypes = {
  path: PropTypes.object.isRequired,
  displayState: PropTypes.object.isRequired,
  numPages: PropTypes.number.isRequired
};

// how am I supposed to declare that the connected component takes a
// `displayState` prop, but the internal component doesn't?
function mapStateToProps(state, ownProps) {
  const items = numItemsToPaginate(state.db, ownProps.path.outputSchemaId, ownProps.displayState);
  return {
    numPages: Math.ceil(items / PAGE_SIZE)
  };
}

export default connect(mapStateToProps)(Pager);
