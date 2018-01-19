/* eslint no-confusing-arrow: 0 */
import { connect } from 'react-redux';
import _ from 'lodash';
import { withRouter } from 'react-router';
import RecentActions from 'datasetManagementUI/components/RecentActions/RecentActions';
import * as ApplyRevision from 'datasetManagementUI/reduxStuff/actions/applyRevision';

// type alias ActivityItem :: {
//   type: String
//   createdAt : Date,
//   createdBy : String,
//   source : Object,
//   previousSource: Object
//   sourceId: Number,
//   isid: Number,
//   osid: Number
// }

// type alias Empty :: {
//   type : String
// }

// type Activity = Empty | ActivityItem

const CREATED_AT_FALLBACK = Date.now();
const CREATED_BY_FALLBACK = 'Unknown';
export const ACTIVITY_TYPES = {
  empty: 'EMPTY',
  revision: 'REVISION',
  source: 'SOURCE',
  outputSchema: 'OUTPUT_SCHEMA',
  taskSet: 'TASK_SET',
  taskSetFailed: 'TASK_SET_FAILED',
  taskSetFinished: 'TASK_SET_FINISHED'
};

// shapeRevision :: Array Revisions Int -> Array Activity
export const shapeRevisions = (revisions, revisionSeq) => {
  const currentRevision = revisions.find(revision => revision.revision_seq === revisionSeq);

  if (!currentRevision) {
    return [{ type: ACTIVITY_TYPES.empty }];
  }

  const createdAt = currentRevision.created_at || CREATED_AT_FALLBACK;
  const createdBy = currentRevision.created_by.display_name || CREATED_BY_FALLBACK;

  return [
    {
      type: ACTIVITY_TYPES.revision,
      createdAt,
      createdBy
    }
  ];
};

// shapeSources :: Array Sources -> Array Activity
export const shapeSources = sources => {
  return sources.length === 0
    ? [{ type: ACTIVITY_TYPES.empty }]
    : sources.map(source => {
        // Previous is the source that references this same file, but is different (ie:
        // parse-options have changed). It will be included to the activity so it can more
        // accurately indicate what happened
      const previousSources = sources.filter(s => s.id < source.id && s.blob === source.blob);
      let previous;
      if (previousSources.length > 0) {
        previous = _.last(_.orderBy(previousSources, s => s.id));
      }
      return {
        type: ACTIVITY_TYPES.source,
        createdAt: source.created_at || CREATED_AT_FALLBACK,
        createdBy: source.created_by.display_name || CREATED_BY_FALLBACK,
        source,
        previousSource: previous
      };
    });
};

// shapeOutputSchemas :: (Array OutputSchema) (Array InputSchema) (Array Sources)
//     -> Array Activity
export const shapeOutputSchemas = (oss, iss, ss) =>
  oss.length === 0
    ? [{ type: ACTIVITY_TYPES.empty }]
    : oss.map(os => {
      const inputSchema = iss.find(is => is.id === os.input_schema_id);
      const source = ss.find(s => s.id === inputSchema.source_id);

      return {
        type: ACTIVITY_TYPES.outputSchema,
        createdAt: os.created_at || CREATED_AT_FALLBACK,
        createdBy: os.created_by.display_name || CREATED_BY_FALLBACK,
        sourceId: source.id,
        isid: inputSchema.id,
        osid: os.id
      };
    });

// shapeTaskSets :: Array TaskSet -> Array Activity
export const shapeTaskSets = tss =>
  tss.length === 0
    ? [{ type: ACTIVITY_TYPES.empty }]
    : tss.map(ts => ({
      type: ACTIVITY_TYPES.taskSet,
      createdAt: ts.created_at || CREATED_AT_FALLBACK,
      createdBy: ts.created_by.display_name || CREATED_BY_FALLBACK
    }));

// shapeFailedTaskSets :: Array TaskSet -> Array Activity
export const shapeFailedTaskSets = tss => {
  const failed = tss
    .filter(ts => !!ts.finished_at)
    .filter(ts => ts.status === ApplyRevision.TASK_SET_FAILURE);

  return failed.length === 0
    ? [{ type: ACTIVITY_TYPES.empty }]
    : failed.map(ts => ({
      type: ACTIVITY_TYPES.taskSetFailed,
      createdAt: ts.finished_at || CREATED_AT_FALLBACK,
      createdBy: ts.created_by.display_name || CREATED_BY_FALLBACK
    }));
};

// shapeFinishedTaskSets :: Arrray TaskSet -> Array Activity
export const shapeFinishedTaskSets = tss => {
  const finished = tss
    .filter(ts => !!ts.finished_at)
    .filter(ts => ts.status === ApplyRevision.TASK_SET_SUCCESSFUL);

  return finished.length === 0
    ? [{ type: ACTIVITY_TYPES.empty }]
    : finished.map(ts => ({
      type: ACTIVITY_TYPES.taskSetFinished,
      createdAt: ts.finished_at || CREATED_AT_FALLBACK,
      createdBy: ts.created_by.display_name || CREATED_BY_FALLBACK
    }));
};

// createActivities :: Entities Params -> Array Activity
export const createActivities = (entities, params) => {
  const activities = [
    ...shapeRevisions(_.values(entities.revisions), _.toNumber(params.revisionSeq)),
    ...shapeSources(_.values(entities.sources)),
    ...shapeOutputSchemas(
      _.values(entities.output_schemas),
      _.values(entities.input_schemas),
      _.values(entities.sources)
    ),
    ...shapeTaskSets(_.values(entities.task_sets)),
    ...shapeFailedTaskSets(_.values(entities.task_sets)),
    ...shapeFinishedTaskSets(_.values(entities.task_sets))
  ];

  return _.chain(activities)
    .filter(activity => activity.type !== ACTIVITY_TYPES.empty)
    .sortBy(activity => activity.createdAt)
    .reverse()
    .value();
};

const mapStateToProps = ({ entities }, { params }) => ({
  activities: createActivities(entities, params),
  params
});

export default withRouter(connect(mapStateToProps)(RecentActions));
