import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import * as Selectors from 'datasetManagementUI/selectors';
import * as ApplyRevision from 'datasetManagementUI/reduxStuff/actions/applyRevision';
import * as TableViews from './TableViews';

function generateTableView({ tasksExist, allTasksSucceeded, outputSchema, blob, hrefExists }) {
  if (tasksExist && allTasksSucceeded && outputSchema) {
    return TableViews.UpsertCompleteView;
  } else if (tasksExist && !allTasksSucceeded && outputSchema) {
    return TableViews.UpsertInProgressView;
  } else if (!tasksExist && (outputSchema || blob)) {
    return TableViews.PreviewDataView;
  } else if (hrefExists) {
    return TableViews.HrefView;
  } else {
    return TableViews.NoDataYetView;
  }
}

// HELPER FUNCTIONS
const numberOfTasks = _.flowRight(_.size, _.filter);

const doTasksExist = entities =>
  numberOfTasks(entities.task_sets, uj => uj.status !== ApplyRevision.TASK_SET_FAILURE) > 0;

const haveAllTasksSucceeded = entities =>
  _.map(entities.task_sets, uj => uj.status === ApplyRevision.TASK_SET_SUCCESSFUL).reduce(
    (acc, success) => success || acc,
    false
  );

// MAIN COMPONENT
const TablePreview = ({ entities, params, view }) => {
  const tasksExist = doTasksExist(entities);
  const allTasksSucceeded = haveAllTasksSucceeded(entities);
  const revisionSeq = _.toNumber(params.revisionSeq);
  const outputSchema = Selectors.currentOutputSchema(entities, revisionSeq);
  const blob = Selectors.currentBlobSource(entities, revisionSeq);
  const hrefExists = !!Selectors.currentRevision(entities, revisionSeq).href.length;
  const editMode = entities.views[params.fourfour].displayType !== 'draft';

  const TableView = generateTableView({ tasksExist, allTasksSucceeded, outputSchema, blob, hrefExists });
  const childProps = { view, outputSchema, entities, blob, editMode, params };
  return (
    <section className="table-preview-container">
      <TableView {...childProps} />
    </section>
  );
};

TablePreview.propTypes = {
  entities: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  view: PropTypes.object.isRequired
};

export default TablePreview;
