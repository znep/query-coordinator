import _ from 'lodash';
import * as dsmapiLinks from 'datasetManagementUI/links/dsmapiLinks';
import { editRevision } from 'datasetManagementUI/reduxStuff/actions/revisions';
import { showModal } from 'datasetManagementUI/reduxStuff/actions/modal';
import * as ApplyRevision from 'datasetManagementUI/reduxStuff/actions/applyRevision';
import { addNotification } from 'datasetManagementUI/reduxStuff/actions/notifications';
import { createSourceSuccess } from 'datasetManagementUI/reduxStuff/actions/createSource';
import {
  subscribeToOutputSchemaThings,
  subscribeToRevision
} from 'datasetManagementUI/reduxStuff/actions/subscriptions';
import {
  addFieldValuesAll,
  createFieldsets,
  validateFieldsets
} from 'datasetManagementUI/containers/ManageMetadataContainer';
import { normalizeCreateSourceResponse } from 'datasetManagementUI/lib/jsonDecoders';
import { socrataFetch, checkStatus, getJson } from 'datasetManagementUI/lib/http';
import { parseDate } from 'datasetManagementUI/lib/parseDate';
import { apiCallFailed } from 'datasetManagementUI/reduxStuff/actions/apiCalls';

export const LOAD_REVISION_SUCCESS = 'LOAD_REVISION_SUCCESS';

// loadRevision is called every time the app root (ie the Home component) mounts.
// It controls the modal of absolution
export function loadRevision(params) {
  return (dispatch, getState) => {
    const { views } = getState().entities;

    return Promise.all([dispatch(getCurrentRevision(params)), dispatch(getSources(params))])
      .then(([revision, srcs]) => {
        // calc md errors
        const view = views[revision.fourfour];
        const { customMetadataFieldsets } = view;
        const datasetMetadata = addFieldValuesAll(createFieldsets(customMetadataFieldsets), revision);
        const metadataErrors = validateFieldsets(datasetMetadata);

        // make taskSets to insert into store
        const taskSets = makeTaskSets(revision);

        // show toast for any failed notifications
        // const [failed, succeeded] = _.partition(srcs, source => source.failed_at);
        // failed.forEach(source => dispatch(addNotification('source', null, source.id)));
        srcs
          .filter(source => !!source.failed_at)
          .forEach(source => dispatch(addNotification('source', source.id)));

        // subscribe to sockets for input / output schemas
        _.flatMap(srcs, source =>
          source.schemas.map(schema => ({
            ...schema,
            source_id: source.id
          }))
        )
          .filter(source => !source.failed_at)
          .forEach(subscribeToOutputSchemaThings);

        // insert new transforms, input schemas, etc into store; we parse this
        // stuff using the same code that we use when we create a new source
        srcs.forEach(src => {
          const payload = normalizeCreateSourceResponse(src);
          dispatch(createSourceSuccess(payload));
        });

        // insert other stuff into store
        dispatch(loadRevisionSuccess(revision, taskSets, metadataErrors));

        // poll
        revision.task_sets.forEach(taskSet => {
          if (
            taskSet.status !== ApplyRevision.TASK_SET_SUCCESS &&
            taskSet.status !== ApplyRevision.TASK_SET_FAILURE
          ) {
            dispatch(ApplyRevision.pollForTaskSetProgress(taskSet.id, params));
          }
        });

        const isInProgressOrSuccessful = _.some(
          revision.task_sets,
          ts => ts.status !== ApplyRevision.TASK_SET_FAILURE
        );

        // if revision is closed or there is a job in progress,
        // show the modal of absolution that blocks further action
        if (revision.closed_at || isInProgressOrSuccessful) {
          dispatch(showModal('Publishing'));
        }

        // subscribe to the revision channel, mostly to catch output schema id updates
        dispatch(subscribeToRevision(revision.id));
      });
  };
}

function loadRevisionSuccess(revision, taskSets, metadataErrors) {
  return {
    type: LOAD_REVISION_SUCCESS,
    revision,
    taskSets,
    metadataErrors
  };
}

function makeTaskSets(revision) {
  return revision.task_sets.reduce(
    (acc, taskSet) => ({
      ...acc,
      [taskSet.id]: {
        ...taskSet,
        created_at: parseDate(taskSet.created_at),
        finished_at: taskSet.finished_at ? parseDate(taskSet.finished_at) : null,
        created_by: taskSet.created_by
      }
    }),
    {}
  );
}

export function getCurrentRevision(params) {
  return dispatch =>
    socrataFetch(dsmapiLinks.revisionBase(params))
      .then(checkStatus)
      .then(getJson)
      .then(({ resource }) => {
        return {
          id: resource.id,
          action: resource.action,
          fourfour: resource.fourfour,
          metadata: resource.metadata,
          href: resource.href,
          output_schema_id: resource.output_schema_id,
          permission: _.get(resource, 'action.permission', 'public'),
          task_sets: resource.task_sets,
          revision_seq: _.toNumber(resource.revision_seq),
          created_at: parseDate(resource.created_at),
          created_by: resource.created_by,
          closed_at: resource.closed_at ? parseDate(resource.closed_at) : null,
          attachments: resource.attachments,
          is_parent: resource.is_parent
        };
      })
      .catch(error => {
        dispatch(apiCallFailed(null, error));
        throw error;
      });
}

export function getRevision(params) {
  return dispatch =>
    getCurrentRevision(params, dispatch)
      .then(rev => dispatch(editRevision(rev.id, rev)))
      .catch(() => console.warn('Revision fetch failed'));
}

function getSources(params) {
  return dispatch =>
    socrataFetch(dsmapiLinks.sourceIndex(params))
      .then(checkStatus)
      .then(getJson)
      .then(revisions => {
        return revisions.map(revision => revision.resource);
      })
      .catch(error => {
        dispatch(apiCallFailed(null, error));
        throw error;
      });
}
