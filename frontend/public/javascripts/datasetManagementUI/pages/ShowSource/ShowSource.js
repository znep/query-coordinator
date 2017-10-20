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
import SaveButtons from './SaveButtons';
import { updateRevision } from 'reduxStuff/actions/revisions';
import { markFormClean, setFormErrors } from 'reduxStuff/actions/forms';
import { showFlashMessage } from 'reduxStuff/actions/flashMessage';
import * as Links from 'links/links';
import * as Selectors from 'selectors';
import styles from './ShowSource.scss';

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
          <SaveButtons
            handleSave={handleSave}
            handleSaveAndExit={handleSaveAndExit}
            callParams={callParams}
            isDirty={hrefFormDirty} />
        </ModalFooter>
      )}
    </Modal>
  </div>
);

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

const mergeProps = (stateProps, { dispatch }, ownProps) => {
  const callParams = {
    href: shapeHrefState(stateProps.hrefFormState)
  };

  const goHome = () => browserHistory.push(Links.revisionBase(ownProps.params));

  const save = (andExit = false) => {
    return dispatch(updateRevision(callParams, ownProps.params))
      .then(() => {
        dispatch(showFlashMessage('success', 'Data saved successfully.'));
        dispatch(markFormClean('hrefForm'));
      })
      .then(() => {
        if (andExit) {
          goHome();
        }
      })
      .catch(err =>
        err.response.json().then(({ message, reason }) => {
          if (!message || !reason) {
            return;
          }

          const errors = _.chain(reason.href)
            .filter(href => !_.isEmpty(href))
            .flatMap(href => href.urls)
            .value();

          dispatch(setFormErrors('hrefForm', errors));
          dispatch(showFlashMessage('error', message));
        })
      );
  };

  return {
    ...stateProps,
    ...ownProps,
    goHome,
    handleSave: save,
    handleSaveAndExit: () => save(true),
    callParams
  };
};

export default connect(mapStateToProps, null, mergeProps)(ShowSource);
