import React from 'react';
import { Route, Redirect, IndexRoute } from 'react-router';
import App from './components/App';
import ShowRevision from './components/ShowRevision';
import ManageMetadata from './components/ManageMetadata';
import ShowOutputSchema from './components/ShowOutputSchema';
import { focusColumnEditor } from './actions/manageMetadata';
import ShowUpload from './components/ShowUpload';
import NoMatch from './components/NoMatch';
import _ from 'lodash';

const checkUploadStatus = store => (nextState, replace) => {
  const uploadExists = !_.isEmpty(store.getState().entities.output_columns);

  const { category, fourfour, name, revisionSeq, locale } = nextState.params;

  if (uploadExists) {
    store.dispatch(focusColumnEditor(nextState));
  } else {
    let newURL = `/${category}/${name}/${fourfour}/revisions/${revisionSeq}`;

    if (locale) {
      newURL = `/${locale}${newURL}`;
    }

    replace(newURL);
  }
};

const checkUpsertStatus = store => (nextState, replace, blocking) => {
  const upsertJob = _.maxBy(_.values(store.getState().entities.task_sets), job => job.updated_at);

  const { category, fourfour, name, revisionSeq, locale } = nextState.params;
  let newPath = `/${category}/${name}/${fourfour}/revisions/${revisionSeq}`;

  if (locale) {
    newPath = `/${locale}${newPath}`;
  }

  if (upsertJob && newPath !== nextState.location.pathname) {
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
