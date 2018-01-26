import _ from 'lodash';
import { browserHistory } from 'react-router';
import * as Links from 'datasetManagementUI/links/links';
import { UNSAVED } from 'datasetManagementUI/components/ManageMetaData/ManageMetadata';
import * as ModalActions from 'datasetManagementUI/reduxStuff/actions/modal';

export const dismissMetadataPane = (
  currentOutputSchemaPath,
  params,
  colFormStatus,
  datasetFormStatus,
  closeUnsaved = false
) => (dispatch, getState) => {
  if (!closeUnsaved || colFormStatus === UNSAVED || datasetFormStatus === UNSAVED) {
    dispatch(ModalActions.showModal('ManageMetadata'));
    return;
  }

  const { history } = getState().ui;
  const isMetadataModalPath = /^\/[\w-]+\/.+\/\w{4}-\w{4}\/revisions\/\d+\/metadata.*/; // eslint-disable-line
  const isShowOutputSchemaPath = /^\/[\w-]+\/.+\/\w{4}-\w{4}\/revisions\/\d+\/sources\/\d+\/schemas\/\d+\/output\/\d+/; // eslint-disable-line

  // helper determines where to route users once they close the
  // modal that holds the column and dataset metedata forms
  const helper = hist => {
    const previousLocation = hist[hist.length - 1];

    // is this the first page you have visited? If so, just route to home page
    if (hist.length === 0) {
      browserHistory.push(Links.revisionBase(params));

      // did you come from ShowOutputSchema page? If so, route to that same page, but
      // show the new output schema (since update column metadata creates an new schema).
      // Note that we assume currentOutputSchemaPath will be falsey if on the dataset
      // metadata form--ie we rely on the programmer to not pass it in if on the dataset
      // tab.
    } else if (currentOutputSchemaPath && isShowOutputSchemaPath.test(previousLocation.pathname)) {
      browserHistory.push(currentOutputSchemaPath);

      // did you come from one of the tabs in the metadata modal? If so, forget that
      // location and try again
    } else if (isMetadataModalPath.test(previousLocation.pathname)) {
      helper(hist.slice(0, -1));
    } else {
      browserHistory.push(previousLocation.pathname);
    }
  };

  helper(history);
};

export function focusColumnEditor(routerState) {
  return () => {
    const hash = routerState.location.hash;
    if (hash.length > 1) {
      // react router doesn't seem to provide a hook for after the component
      // has rendered, so we have to do this
      setTimeout(() => {
        const columnId = _.toNumber(hash.slice(1));
        const element = document.getElementById(`display-name-${columnId}`);
        if (element) {
          element.focus();
        }
      }, 0);
    }
  };
}
