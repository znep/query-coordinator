/* eslint react/jsx-indent: 0 */
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import SourceBreadcrumbs from 'containers/SourceBreadcrumbsContainer';
import SourceSidebar from 'containers/SourceSidebarContainer';
import FlashMessage from 'containers/FlashMessageContainer';
import ApiCallButton from 'containers/ApiCallButtonContainer';
import { updateRevision } from 'reduxStuff/actions/revisions';
import { UPDATE_REVISION } from 'reduxStuff/actions/apiCalls';
import { markFormClean, setFormErrors } from 'reduxStuff/actions/forms';
import { showFlashMessage } from 'reduxStuff/actions/flashMessage';
import * as Links from 'links/links';
import * as Selectors from 'selectors';
import styles from './ShowSource.scss';

const Buttons = ({ handleSave, handleSaveAndExit, callParams, isDirty }) => (
  <div>
    <ApiCallButton
      forceDisable={!isDirty}
      onClick={handleSave}
      operation={UPDATE_REVISION}
      callParams={callParams} />
    <ApiCallButton
      forceDisable={!isDirty}
      onClick={handleSaveAndExit}
      operation={UPDATE_REVISION}
      callParams={callParams}>
      Save and Exit
    </ApiCallButton>
  </div>
);

Buttons.propTypes = {
  handleSave: PropTypes.func.isRequired,
  handleSaveAndExit: PropTypes.func.isRequired,
  callParams: PropTypes.object.isRequired,
  isDirty: PropTypes.bool.isRequired
};

export const ShowSource = ({
  inProgress,
  goHome,
  children,
  onHrefPage,
  handleSave,
  handleSaveAndExit,
  callParams,
  hrefFormDirty
}) => (
  <div className={styles.showUpload}>
    <Modal fullScreen onDismiss={goHome}>
      <ModalHeader onDismiss={goHome}>
        <SourceBreadcrumbs atShowSource />
      </ModalHeader>
      <ModalContent className={styles.modalContent}>
        <FlashMessage />
        {inProgress ? (
          <div className={styles.centeredContainer}>
            <span className={styles.spinner} />
          </div>
        ) : (
          <div className={styles.sourceContainer}>
            <SourceSidebar />
            {children}
          </div>
        )}
      </ModalContent>
      {onHrefPage && (
        <ModalFooter>
          <Buttons
            handleSave={handleSave}
            handleSaveAndExit={handleSaveAndExit}
            callParams={callParams}
            isDirty={hrefFormDirty} />
        </ModalFooter>
      )}
    </Modal>
  </div>
);

export const mapStateToProps = ({ entities, ui }, { params, routes }) => {
  // selector returns undefined if there are no sources
  const source = Selectors.currentSource(entities, _.toNumber(params.revisionSeq));

  const hrefFormDirty = ui.forms.hrefForm.isDirty;

  const revision = Selectors.currentRevision(entities, _.toNumber(params.revisionSeq));

  let hrefs = [];

  if (revision && revision.href && Array.isArray(revision.href)) {
    hrefs = revision.href;
  }

  // "routes" is supplied by react router; it is an array of all matched routes for
  // the current path (including nested routes). Here we check that array for the
  // href path. This is kind of hacky but more reliable than parsing with a regexp
  const onHrefPage = routes.map(route => route.path).includes('href');

  // Include source in the definition of inProgress because if there is no source,
  // we don't want to show the spinner, we want to show the actual component so the
  // user can source something
  return {
    onHrefPage,
    hrefFormDirty,
    inProgress: !!source && (!source.finished_at && !source.failed_at),
    hrefFormState: hrefs
  };
};

ShowSource.propTypes = {
  inProgress: PropTypes.bool.isRequired,
  goHome: PropTypes.func.isRequired,
  children: PropTypes.object.isRequired,
  onHrefPage: PropTypes.bool.isRequired,
  handleSave: PropTypes.func.isRequired,
  handleSaveAndExit: PropTypes.func.isRequired,
  callParams: PropTypes.object.isRequired,
  hrefFormDirty: PropTypes.bool.isRequired
};

const removeEmptyValues = obj => _.omitBy(obj, val => !val);

const shapeHrefState = rawState =>
  rawState.map(href => ({
    ...href,
    urls: removeEmptyValues(href.urls)
  }));

const mergeProps = (stateProps, { dispatch }, ownProps) => {
  const callParams = {
    href: shapeHrefState(stateProps.hrefFormState)
  };

  const goHome = () => browserHistory.push(Links.revisionBase(ownProps.params));

  const save = () => {
    return dispatch(updateRevision(callParams, ownProps.params))
      .then(() => dispatch(markFormClean('hrefForm')))
      .catch(err => err.response.json())
      .then(({ message, reason }) => {
        const errors = _.chain(reason.href)
          .filter(href => !_.isEmpty(href))
          .flatMap(href => href.urls)
          .value();

        dispatch(setFormErrors('hrefForm', errors));
        dispatch(showFlashMessage('error', message));
      });
  };

  return {
    ...stateProps,
    ...ownProps,
    goHome,
    handleSave: save,
    handleSaveAndExit: () => {
      save().then(() => goHome());
    },
    callParams
  };
};

export default connect(mapStateToProps, null, mergeProps)(ShowSource);
