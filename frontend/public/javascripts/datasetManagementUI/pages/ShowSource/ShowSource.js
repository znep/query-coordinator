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
import { markFormClean, appendFormErrors, setFormErrors } from 'reduxStuff/actions/forms';
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

const removeEmptyValues = hrefURLObj => _.omitBy(hrefURLObj, val => !val.url);

const findDupes = hrefURLObj => {
  const filetypes = Object.values(hrefURLObj).map(val => val.filetype);

  const dupes = filetypes.filter(filetype => {
    const firstIdx = _.findIndex(filetypes, ft => ft === filetype);
    const withCurrentOmitted = filetypes.filter((ft, idx) => firstIdx !== idx);
    return withCurrentOmitted.includes(filetype);
  });

  return [...new Set(dupes)];
};

const makeExtKeys = hrefURLObj =>
  Object.keys(hrefURLObj).reduce((acc, uuid) => {
    const entry = hrefURLObj[uuid];

    return {
      ...acc,
      [entry.filetype]: entry.url
    };
  }, {});

const shapeHrefState = rawState =>
  rawState.map(href => ({
    ...href,
    urls: makeExtKeys(removeEmptyValues(href.urls))
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
    hrefs,
    inProgress: !!source && (!source.finished_at && !source.failed_at)
  };
};

const mergeProps = (stateProps, { dispatch }, ownProps) => {
  const dupes = _.chain(stateProps.hrefs)
    .flatMap(href => {
      if (!_.isEmpty(href.urls) && _.isPlainObject(Object.values(href.urls)[0])) {
        return [{ hrefId: href.id, type: 'filetypeError', dupes: findDupes(href.urls) }];
      } else {
        return [];
      }
    })
    .filter(err => !!err.dupes.length)
    .value();

  const callParams = {
    href: dupes.length ? [] : shapeHrefState(stateProps.hrefs)
  };

  const goHome = () => browserHistory.push(Links.revisionBase(ownProps.params));

  const save = (andExit = false) => {
    if (dupes.length) {
      dispatch(showFlashMessage('error', 'duplicate file types'));
      dispatch(appendFormErrors('hrefForm', dupes));
      return;
    }

    return dispatch(updateRevision(callParams, ownProps.params))
      .then(() => {
        dispatch(showFlashMessage('success', 'Data saved successfully.'));
        dispatch(markFormClean('hrefForm'));
        dispatch(setFormErrors('hrefForm', []));
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

          dispatch(appendFormErrors('hrefForm', [{ type: 'urlError', urls: errors }]));
          dispatch(showFlashMessage('error', message));
        })
      );
  };

  return {
    ...stateProps,
    ...ownProps,
    goHome,
    handleSave: () => save(),
    handleSaveAndExit: () => save(true),
    callParams
  };
};

export default connect(mapStateToProps, null, mergeProps)(ShowSource);
