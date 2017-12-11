import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import * as Selectors from 'selectors';
import * as ApplyRevision from 'reduxStuff/actions/applyRevision';
import styles from './TablePreview.scss';
import * as TableViews from "./TableViews"

function generateTableView(tasksExist, allTasksSucceeded, os, blob, hrefExists) {
  if (tasksExist && allTasksSucceeded && os) {
    return TableViews.UpsertCompleteView;
  } else if (tasksExist && !allTasksSucceeded && os) {
    return TableViews.UpsertInProgressView;
  } else if (!tasksExist && (os || blob)) {
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
  let child;
  const tasksExist = doTasksExist(entities);
  const allTasksSucceeded = haveAllTasksSucceeded(entities);
  const revisionSeq = _.toNumber(params.revisionSeq);
  const os = Selectors.currentOutputSchema(entities, revisionSeq);
  const blob = Selectors.currentBlobSource(entities, revisionSeq);
  const hrefExists = !!Selectors.currentRevision(entities, revisionSeq).href.length;

  const TableView = generateTableView(tasksExist, allTasksSucceeded, os, blob, hrefExists);
  const childProps = {
    view: view,
    outputSchema: os,
    entities: entities,
    blob: blob,
    params: params
  };

  return (
    <section className="table-preview-container">
      {React.createElement(TableView, childProps, null)}
    </section>
  );
};

TablePreview.propTypes = {
  entities: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  view: PropTypes.object.isRequired
};

export default TablePreview;
