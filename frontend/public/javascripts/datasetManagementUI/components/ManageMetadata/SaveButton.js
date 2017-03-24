import _ from 'lodash';
import React, { PropTypes } from 'react';
import {
  STATUS_DIRTY,
  STATUS_DIRTY_IMMUTABLE,
  STATUS_SAVED,
  STATUS_UPDATING,
  STATUS_UPDATING_IMMUTABLE
} from '../../lib/database/statuses';

export default function SaveButton({ onSave, view, outputSchema, outputColumns }) {
  const metadataRecords = [
    view,
    ...outputColumns
  ];
  if (outputSchema) {
    metadataRecords.push(outputSchema);
  }
  const metadataRecordStatuses = metadataRecords.map((record) => record.__status__.type);

  let overallStatus;
  if (_.some(metadataRecordStatuses,
      (status) => status === STATUS_DIRTY_IMMUTABLE || status === STATUS_DIRTY)) {
    overallStatus = STATUS_DIRTY;
  } else if (_.some(metadataRecordStatuses, (status) =>
        status === STATUS_UPDATING_IMMUTABLE || status === STATUS_UPDATING)) {
    overallStatus = STATUS_UPDATING;
  } else {
    overallStatus = STATUS_SAVED;
  }

  switch (overallStatus) {
    case STATUS_SAVED:
      return (
        <button
          id="save"
          className="btn btn-primary btn-success"
          disabled="true">
          {I18n.common.save}
        </button>
      );

    case STATUS_UPDATING:
      return (
        <button
          id="save"
          className="btn btn-primary btn-busy btn-sm">
          <span className="spinner-default spinner-btn-primary" />
        </button>
      );

    default: // STATUS_DIRTY
      return (
        <button
          id="save"
          className="btn btn-primary"
          onClick={onSave}>
          {I18n.common.save}
        </button>
      );
  }
}

SaveButton.propTypes = {
  onSave: PropTypes.func.isRequired,
  view: PropTypes.object.isRequired,
  outputSchema: PropTypes.object.isRequired,
  outputColumns: PropTypes.array.isRequired
};
