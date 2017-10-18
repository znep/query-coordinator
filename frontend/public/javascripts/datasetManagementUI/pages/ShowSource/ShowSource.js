import _ from 'lodash';

/* eslint react/jsx-indent: 0 */
import PropTypes from 'prop-types';

import React from 'react';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import * as Links from 'links/links';
import * as Selectors from 'selectors';
import SourceBreadcrumbs from 'containers/SourceBreadcrumbsContainer';
import SourceSidebar from 'containers/SourceSidebarContainer';
import FlashMessage from 'containers/FlashMessageContainer';
import styles from './ShowSource.scss';

export const ShowSource = ({ inProgress, goHome, children, onHrefPage }) => (
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
      {onHrefPage && <ModalFooter>wood</ModalFooter>}
    </Modal>
  </div>
);

export const mapStateToProps = ({ entities, ui }, { params, routes }) => {
  // selector returns undefined if there are no sources
  const source = Selectors.currentSource(entities, _.toNumber(params.revisionSeq));

  // "routes" is supplied by react router; it is an array of all matched routes for
  // the current path (including nested routes). Here we check that array for the
  // href path. This is kind of hacky but more reliable than parsing with a regexp
  const onHrefPage = routes.map(route => route.path).includes('href');

  // Include source in the definition of inProgress because if there is no source,
  // we don't want to show the spinner, we want to show the actual component so the
  // user can source something
  return {
    inProgress: !!source && (!source.finished_at && !source.failed_at),
    onHrefPage
  };
};

ShowSource.propTypes = {
  inProgress: PropTypes.bool.isRequired,
  goHome: PropTypes.func.isRequired,
  handleHrefFormSubmit: PropTypes.func.isRequired,
  children: PropTypes.object.isRequired,
  onHrefPage: PropTypes.bool.isRequired
};

export const mapDispatchToProps = (dispatch, ownProps) => ({
  goHome: () => browserHistory.push(Links.revisionBase(ownProps.params)),
  handleHrefFormSubmit: data => {
    // the reasonable place to define this is the form itself, but can't do that
    // because of this stupid page-modal thing
    console.log('data', data);
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(ShowSource);
