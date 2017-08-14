import React from 'react';
import _ from 'lodash';
import { Route, Redirect, IndexRoute } from 'react-router';
import * as Links from 'links';
import App from 'pages/App/App';
import ShowRevision from 'pages/ShowRevision/ShowRevision';
import ManageMetadata from 'pages/ManageMetadata/ManageMetadata';
import ShowOutputSchema from 'pages/ShowOutputSchema/ShowOutputSchema';
import { focusColumnEditor } from 'reduxStuff/actions/manageMetadata';
import ShowUpload from 'pages/ShowUpload/ShowUpload';
import NoMatch from 'pages/NoMatch/NoMatch';

const checkUploadStatus = store => (nextState, replace) => {
  // TODO: is this valid? You can have a source with no output schema
  const sourceExists = !_.isEmpty(store.getState().entities.output_columns);

  if (sourceExists) {
    store.dispatch(focusColumnEditor(nextState));
  } else {
    const newPath = Links.home(nextState.params);

    replace(newPath);
  }
};

const checkUpsertStatus = store => (nextState, replace, blocking) => {
  const taskSet = _.maxBy(_.values(store.getState().entities.task_sets), job => job.updated_at);

  const newPath = Links.home(nextState.params);

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
      <Route
        path="metadata/:outputSchemaId/columns"
        component={ManageMetadata}
        onEnter={checkUploadStatus(store)} />
      <Route path="sources" component={ShowUpload} />
      <Route path=":sidebarSelection" component={ShowRevision} />
      <Route
        path="sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId"
        component={ShowOutputSchema}>
        <Route path="page/:pageNo" component={ShowOutputSchema} />
      </Route>
      <Route
        path={
          'sources/:sourceId/schemas/:inputSchemaId/output/' +
          ':outputSchemaId/column_errors/:errorsTransformId'
        }
        component={ShowOutputSchema}>
        <Route path="page/:pageNo" component={ShowOutputSchema} />
      </Route>
      <Route
        path="sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId/row_errors"
        component={ShowOutputSchema}>
        <Route path="page/:pageNo" component={ShowOutputSchema} />
      </Route>
      <Route path="*" component={NoMatch} />
    </Route>
  );
}
