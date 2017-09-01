/* eslint new-cap: 0 */
/* eslint no-confusing-arrow: 0 */
import daggy from 'lib/daggy';
import { connect } from 'react-redux';
import _ from 'lodash';
import { withRouter } from 'react-router';
import RecentActions from 'components/RecentActions/RecentActions';
import * as ApplyRevision from 'reduxStuff/actions/applyRevision';

const Activity = daggy.taggedSum('Activity', {
  Revision: ['details'],
  Source: ['details'],
  OutputSchema: ['details'],
  TaskSet: ['details'],
  FinishedTaskSet: ['details'],
  FailedTaskSet: ['details'],
  Empty: []
});

// shapeRevision :: [Revisions] -> Int -> [Activity]
const shapeRevisions = (revisions, revisionSeq) => {
  const currentRevision = revisions.find(revision => revision.revision_seq === revisionSeq);

  if (!currentRevision) {
    return [Activity.Empty];
  }

  const createdAt = currentRevision.created_at || 'hmm';
  const createdBy = currentRevision.created_by.display_name || 'Unknown';

  return [
    Activity.Revision({
      createdAt,
      createdBy
    })
  ];
};

// shapeSources :: [Sources] -> [Activity]
const shapeSources = sources =>
  sources.length === 0
    ? [Activity.Empty]
    : sources.map(source =>
        Activity.Source({
          createdAt: source.created_at,
          createdBy: source.created_by.display_name
        })
      );

// shapeOutputSchemas :: [OutputSchema] -> [InputSchema] -> [Sources]  -> [Activity]
const shapeOutputSchemas = (oss, iss, ss) =>
  oss.length === 0
    ? [Activity.Empty]
    : oss.map(os => {
      const inputSchema = iss.find(is => is.id === os.input_schema_id);
      const source = ss.find(s => s.id === inputSchema.source_id);

      return Activity.OutputSchema({
        createdAt: os.created_at,
        createdBy: os.created_by.display_name,
        sourceId: source.id,
        isid: inputSchema.id,
        osid: os.id
      });
    });

// shapeTaskSets :: [TaskSet] -> [Activity]
const shapeTaskSets = tss =>
  tss.length === 0
    ? [Activity.Empty]
    : tss.map(ts =>
        Activity.TaskSet({
          createdAt: ts.created_at,
          createdBy: ts.created_by.display_name
        })
      );

// shapeFailedTaskSets :: [TaskSet] -> [Activity]
const shapeFailedTaskSets = tss => {
  const failed = tss
    .filter(ts => !!ts.finished_at)
    .filter(ts => ts.status === ApplyRevision.TASK_SET_FAILURE);

  return failed.length === 0
    ? [Activity.Empty]
    : failed.map(ts =>
        Activity.FailedTaskSet({
          createdAt: ts.finished_at,
          createdBy: ts.created_by.display_name
        })
      );
};

// shapeFinishedTaskSets :: [TaskSet] -> [Activity]
const shapeFinishedTaskSets = tss => {
  const finished = tss
    .filter(ts => !!ts.finished_at)
    .filter(ts => ts.status === ApplyRevision.TASK_SET_SUCCESSFUL);

  return finished.length === 0
    ? [Activity.Empty]
    : finished.map(ts =>
        Activity.FinishedTaskSet({
          createdAt: ts.finished_at,
          createdBy: ts.created_by.display_name
        })
      );
};

// createActivities :: Entities -> Params -> [Activity]
const createActivities = (entities, params) => {
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
    .filter(activity => !Activity.Empty.is(activity))
    .sortBy(activity => activity.details.createdAt)
    .reverse()
    .value();
};

const mapStateToProps = ({ entities }, { params }) => ({
  activities: createActivities(entities, params),
  params
});

export default withRouter(connect(mapStateToProps)(RecentActions));
