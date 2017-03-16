import React, { PropTypes } from 'react';
import { commaify } from '../../../common/formatNumber';
import { Link } from 'react-router';
import * as Links from '../../links';
import * as DisplayState from './displayState';
import { singularOrPlural } from '../../lib/util';

export default function RowErrorsLink({ path, displayState, numRowErrors }) {
  const inRowErrorState = displayState.type === DisplayState.ROW_ERRORS;
  const linkPath = inRowErrorState ?
    Links.showOutputSchema(path.uploadId, path.inputSchemaId, path.outputSchemaId) :
    Links.showRowErrors(path.uploadId, path.inputSchemaId, path.outputSchemaId);

  return (
    <Link to={linkPath}>
      <div className="column-status-text">
        <span className="err-info error">{commaify(numRowErrors)}</span>
        {singularOrPlural(numRowErrors, 'Malformed row', 'Malformed rows')}{/* TODO: I18n */}
      </div>
    </Link>
  );
}

RowErrorsLink.propTypes = {
  path: PropTypes.object.isRequired,
  displayState: PropTypes.object.isRequired,
  numRowErrors: PropTypes.number.isRequired
};
