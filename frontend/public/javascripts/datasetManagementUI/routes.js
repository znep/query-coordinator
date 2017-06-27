import React from 'react';
import { Route, Redirect, IndexRoute } from 'react-router';
import App from './components/App';
import ShowRevision from './components/ShowRevision';
import ManageMetadata from './components/ManageMetadata';
import ShowOutputSchema from './components/ShowOutputSchema';
import { focusColumnEditor } from './actions/manageMetadata';
import ShowUpload from './components/ShowUpload';
import NoMatch from './components/NoMatch';
import { home } from 'links';
import _ from 'lodash';

const checkUploadStatus = store => (nextState, replace) => {
  const uploadExists = !_.isEmpty(store.getState().entities.output_columns);

  if (uploadExists) {
    store.dispatch(focusColumnEditor(nextState));
  } else {
    const newPath = home(nextState.location);

    replace(newPath);
  }
};

const checkUpsertStatus = store => (nextState, replace, blocking) => {
  const taskSet = _.maxBy(_.values(store.getState().entities.task_sets), job => job.updated_at);

  const newPath = home(nextState.location);

  // The intent of this function is to redirect the user to the home screen if
  // they have published to primer. We determine this by the presence of a task set.
  // But we also need to make sure we're not already on the home screen before redirecting
  // , for doing otherwise would result in an infinite redirect.
  if (taskSet && newPath !== nextState.location.pathname) {
    replace(newPath);
  }

  blocking();
};

export default function rootRoute(store) {
  return (
    <Route
      path="/(:locale/):category/:name/:fourfour/revisions/:revisionSeq"
      component={App}
      onEnter={checkUpsertStatus(store)}>

      <IndexRoute component={ShowRevision} />
      <Redirect from="metadata" to="metadata/dataset" />
      <Route path="metadata/dataset" component={ManageMetadata} />
      <Route path="metadata/columns" component={ManageMetadata} onEnter={checkUploadStatus(store)} />
      <Route path="uploads" component={ShowUpload} />
      <Route path=":sidebarSelection" component={ShowRevision} />
      <Route
        path="uploads/:uploadId/schemas/:inputSchemaId/output/:outputSchemaId"
        component={ShowOutputSchema}>
        <Route path="page/:pageNo" component={ShowOutputSchema} />
      </Route>
      <Route
        path={
          'uploads/:uploadId/schemas/:inputSchemaId/output/' +
          ':outputSchemaId/column_errors/:errorsTransformId'
        }
        component={ShowOutputSchema}>
        <Route path="page/:pageNo" component={ShowOutputSchema} />
      </Route>
      <Route
        path="uploads/:uploadId/schemas/:inputSchemaId/output/:outputSchemaId/row_errors"
        component={ShowOutputSchema}>
        <Route path="page/:pageNo" component={ShowOutputSchema} />
      </Route>
      <Route path="*" component={NoMatch} />
    </Route>
  );
}
