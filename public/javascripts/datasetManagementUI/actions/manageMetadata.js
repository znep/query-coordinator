import _ from 'lodash';
import { push } from 'react-router-redux';
import * as Links from '../links';
import { checkStatus, getJson, socrataFetch } from '../lib/http';
import { parseDate } from '../lib/parseDate';
import {
  batch,
  updateStarted,
  updateImmutableStarted,
  revertEdits,
  updateSucceeded,
  updateFailed,
  insertStarted,
  insertSucceeded,
  insertFailed
} from './database';
import {
  STATUS_SAVED,
  STATUS_DIRTY_IMMUTABLE
} from '../lib/database/statuses';
import { insertChildrenAndSubscribeToOutputSchema } from './manageUploads';
import { idForColumnNameField } from '../components/ManageMetadata/ColumnMetadataEditor';
import * as Selectors from '../selectors';
import * as dsmapiLinks from '../dsmapiLinks';

export function saveMetadata() {
  return (dispatch, getState) => {
    const db = getState().db;
    saveDatasetMetadata(dispatch, db);
    saveColumnMetadata(dispatch, db);
  };
}

function saveDatasetMetadata(dispatch, db) {
  const viewStatus = db.views[0].__status__.type;

  if (viewStatus !== STATUS_SAVED) {
    const datasetMetadata = _.pick(
      db.views[0],
      'id', 'name', 'description', 'category' // TODO: what else do we want to save?
    );
    dispatch(updateStarted('views', datasetMetadata));
    socrataFetch(`/api/views/${window.initialState.view.id}`, {
      method: 'PUT',
      body: JSON.stringify(datasetMetadata)
    }).
    then(checkStatus).
    then(() => {
      dispatch(updateSucceeded('views', datasetMetadata));
      dispatch(redirectAfterInterval());
    }).
    catch((error) => {
      dispatch(updateFailed('views', datasetMetadata, error));
    });
  }
}

function saveColumnMetadata(dispatch, db) {
  const currentOutputSchema = _.maxBy(db.output_schemas, 'inserted_at');
  if (!currentOutputSchema) {
    return;
  }

  const currentColumns = Selectors.columnsForOutputSchema(db, currentOutputSchema.id);

  const payload = {
    output_columns: currentColumns.map((column) => {
      return {
        field_name: column.field_name,
        position: column.position,
        display_name: column.display_name,
        description: column.description,
        transform: {
          transform_expr: column.transform.transform_expr
        }
      };
    })
  };

  const newOutputSchema = {
    input_schema_id: currentOutputSchema.input_schema_id
  };
  dispatch(insertStarted('output_schemas', newOutputSchema));
  currentColumns.forEach((column) => {
    if (column.__status__.type === STATUS_DIRTY_IMMUTABLE) {
      dispatch(updateImmutableStarted('output_columns', column.id));
    }
  });
  socrataFetch(dsmapiLinks.newOutputSchema(currentOutputSchema.input_schema_id), {
    method: 'POST',
    body: JSON.stringify(payload)
  }).
    then(checkStatus).
    then(getJson).
    catch((err) => {
      console.error('saving column metadata failed', err);
      dispatch(insertFailed('output_schemas', newOutputSchema, err));
    }).
    then((resp) => {
      dispatch(insertSucceeded('output_schemas', newOutputSchema, {
        id: resp.resource.id,
        inserted_at: parseDate(resp.resource.inserted_at)
      }));
      revertDirtyOutputColumns(dispatch, currentColumns);
      insertChildrenAndSubscribeToOutputSchema(dispatch, resp.resource);
      dispatch(redirectAfterInterval());
    });
}

// this isn't really necessary unless we implement undo...
// but seems right, since we weren't really mutating those output columns in the first place,
// just creating new columns based on them
function revertDirtyOutputColumns(dispatch, outputColumns) {
  const actions = [];
  outputColumns.forEach((outputColumn) => {
    if (outputColumn.__status__.type === STATUS_DIRTY_IMMUTABLE) {
      actions.push(revertEdits('output_columns', outputColumn.id));
    }
  });
  dispatch(batch(actions));
}

// when save succeeds, wait this long until modal goes away
// so user can see "saved" button is green
export const DELAY_UNTIL_CLOSE_MS = 1000;

function redirectAfterInterval() {
  return (dispatch, getState) => {
    setTimeout(() => {
      dispatch(push(Links.home(getState().routing)));
    }, DELAY_UNTIL_CLOSE_MS);
  };
}

export function focusColumnEditor(routerState) {
  return () => {
    const hash = routerState.location.hash;
    if (hash.length > 1) {
      // react router doesn't seem to provide a hook for after the component
      // has rendered, so we have to do this
      setTimeout(() => {
        const columnId = _.toNumber(hash.slice(1));
        const element = document.getElementById(idForColumnNameField(columnId));
        if (element) {
          element.focus();
        }
      }, 0);
    }
  };
}
