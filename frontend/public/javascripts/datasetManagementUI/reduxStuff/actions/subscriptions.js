import _ from 'lodash';
import { editOutputSchema } from 'datasetManagementUI/reduxStuff/actions/outputSchemas';
import { editTransform } from 'datasetManagementUI/reduxStuff/actions/transforms';
import { editInputSchema } from 'datasetManagementUI/reduxStuff/actions/inputSchemas';
import { editInputColumn } from 'datasetManagementUI/reduxStuff/actions/inputColumns';
import { editRevision } from 'datasetManagementUI/reduxStuff/actions/revisions';
import { batchActions } from 'datasetManagementUI/reduxStuff/actions/batching';
import { parseDate } from 'datasetManagementUI/lib/parseDate';
import { normalizeInsertInputSchemaEvent } from 'datasetManagementUI/lib/jsonDecoders';
import { browserHistory } from 'react-router';
import * as Links from 'datasetManagementUI/links/links';
import { removeNotificationAfterTimeout } from 'datasetManagementUI/reduxStuff/actions/notifications';
import { sourceUpdate, createSourceSuccess } from 'datasetManagementUI/reduxStuff/actions/createSource';
import * as Selectors from 'datasetManagementUI/selectors';

const PROGRESS_THROTTLE_TIME = 1000;

export function subscribeToAllTheThings(is) {
  return dispatch => {
    const [os] = is.output_schemas;
    dispatch(subscribeToRowErrors(is));
    dispatch(subscribeToInputColumns(is));
    dispatch(subscribeToTotalRows(is));
    dispatch(subscribeToOutputSchema(os));
    dispatch(subscribeToTransforms(os));
  };
}

export function subscribeToOutputSchemaThings(is) {
  return dispatch => {
    dispatch(subscribeToRowErrors(is));
    is.output_schemas.forEach(os => {
      dispatch(subscribeToOutputSchema(os));
      dispatch(subscribeToTransforms(os));
    });
  };
}

export function subscribeToRevision(id) {
  return (dispatch, getState, socket) => {
    const channel = socket.channel(`revision:${id}`);

    channel.on('update', revision => {
      let rev = revision;

      if (rev.created_at) {
        rev = {
          ...rev,
          created_at: parseDate(rev.created_at)
        };
      }

      dispatch(editRevision(id, rev));
    });

    channel.join();
  };
}

export function subscribeToRowErrors(is) {
  return (dispatch, getState, socket) => {
    const channel = socket.channel(`row_errors:${is.id}`);

    channel.on('errors', ({ errors }) =>
      dispatch(
        editInputSchema(is.id, {
          num_row_errors: errors
        })
      )
    );

    channel.join();
  };
}

export function subscribeToInputColumns(is) {
  return (dispatch, getState, socket) => {
    is.input_columns.forEach(ic => {
      const channel = socket.channel(`input_column:${ic.id}`);

      channel.on('update', ({ semantic_type }) => {
        dispatch(
          editInputColumn(ic.id, {
            semantic_type
          })
        );
      });

      channel.join();
    });
  };
}

export function subscribeToTotalRows(is) {
  return (dispatch, getState, socket) => {
    const channel = socket.channel(`input_schema:${is.id}`);

    channel.on('update', ({ total_rows }) =>
      dispatch(
        editInputSchema(is.id, {
          total_rows
        })
      )
    );

    channel.join();
  };
}

// Called on app load path, upload path, manageColMetadata and showOutputSchema
// actions (e.g. addColumn, dropColumn, which create a new OS). The point of the
// channel is to inform us of DMAPI's progress on processing a column of data.
// The 'update' message will let us know if the processing is done or not. The
// max_ptr channel will give us a more detailed picture of that process, which
// allows us to create the progress bar.
export function subscribeToTransforms(os) {


  return (dispatch, getState, socket) => {

    var batchedActions = [];
    const flushTransformUpdates = _.throttle(() => {
      dispatch(batchActions(batchedActions));
      batchedActions = [];
    }, PROGRESS_THROTTLE_TIME);

    const onTransformAction = (action) => {
      batchedActions.push(action);
      flushTransformUpdates();
    };


    os.output_columns.forEach(oc => {
      // we only want to subscribe to transforms that are NOT completed since,
      // if completed, we don't need to know about their progress. This check
      // is the reason this will be more efficient than what we are curently doing
      if (!oc.transform.finished_at) {
        const transform = oc.transform;
        const channel = socket.channel(`transform:${oc.transform.id}`);

        channel.on('update', ({ finished_at }) => onTransformAction(
          editTransform(oc.transform.id, { finished_at })
        ));

        channel.on('max_ptr', ({ end_row_offset }) => onTransformAction(
          editTransform(transform.id, { contiguous_rows_processed: end_row_offset })
        ));

        channel.on('errors', ({ count }) => onTransformAction(
          editTransform(oc.transform.id, { error_count: count })
        ));

        channel.join();
      }
    });
  };
}

export function subscribeToOutputSchema(os) {
  return (dispatch, getState, socket) => {
    const channel = socket.channel(`output_schema:${os.id}`);

    channel.on('update', newOS => {
      const updatedOS = {
        ...os,
        ...newOS
      };

      dispatch(editOutputSchema(os.id, updatedOS));

      // This seems like a weird place to do this cascading
      // update, but i can't find a better place
      if (updatedOS.finished_at) {
        const transformActions = Selectors.columnsForOutputSchema(
          getState().entities,
          updatedOS.id
        ).map(oc => (
          editTransform(oc.transform.id, { finished_at: updatedOS.finished_at })
        ));

        dispatch(batchActions(transformActions));
      }
    });

    channel.join();
  };
}


export function subscribeToSource(sourceId, params) {
  return (dispatch, getState, socket) => {
    const channel = socket.channel(`source:${sourceId}`);

    channel.on('insert_input_schema', is => {
      let os;

      // A source can have more than one output schema even at this point
      // (e.g. changing the schema on a view source) so don't just take the first
      // one and redirect to it. Take the latest one. Otherwise changing a type
      // e.g. will redirect you to the wrong ouput schema preview page.
      if (is.output_schemas.length === 1) {
        os = is.output_schemas[0];
      } else {
        os = _.maxBy(is.output_schemas, 'id');
      }

      const payload = normalizeInsertInputSchemaEvent(is, sourceId);

      dispatch(createSourceSuccess(payload));

      dispatch(subscribeToAllTheThings(is));

      browserHistory.push(Links.showOutputSchema(params, sourceId, is.id, os.id));
    });

    channel.on('update', changes => {
      dispatch(sourceUpdate(sourceId, changes));

      const source = getState().entities.sources[sourceId];

      // This isn't a great place to do this - figure out a nicer way
      // TODO: aaurhgghiguhuhgghghgh
      if (changes.finished_at) {
        dispatch(removeNotificationAfterTimeout(sourceId));

        if (source && source.parse_options && !source.parse_options.parse_source) {
          browserHistory.push(Links.showBlobPreview(params, sourceId));
        }
      }
    });

    return channel.join();
  };
}
