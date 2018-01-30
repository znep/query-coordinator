/* eslint react/jsx-indent: 0 */
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import SourceBreadcrumbs from 'datasetManagementUI/containers/SourceBreadcrumbsContainer';
import SourceSidebar from 'datasetManagementUI/containers/SourceSidebarContainer';
import WithFlash from 'datasetManagementUI/components/WithFlash/WithFlash';
import SaveButtons from './SaveButtons';
import * as FormActions from 'datasetManagementUI/reduxStuff/actions/forms';
import * as Links from 'datasetManagementUI/links/links';
import * as Selectors from 'datasetManagementUI/selectors';

export const ShowSource = ({
  inProgress,
  goHome,
  children,
  onHrefPage,
  schemaExists,
  saveHrefForm,
  hrefFormDirty
}) => (
  <div id="show-source">
    <Modal fullScreen onDismiss={goHome}>
      <ModalHeader onDismiss={goHome}>
        <SourceBreadcrumbs atShowSource />
      </ModalHeader>
      <ModalContent className="dsmp-modal-content">
        <SourceSidebar />
        {inProgress ? (
          <div className="dsmp-centered-container">
            <span className="spinner-default spinner-large" />
            <p>{I18n.show_uploads.in_progress}</p>
          </div>
        ) : (
          <WithFlash useFlexStyles>{children}</WithFlash>
        )}
      </ModalContent>
      {onHrefPage &&
        !schemaExists && (
          <ModalFooter>
            <SaveButtons saveHrefForm={saveHrefForm} isDirty={hrefFormDirty} />
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
  schemaExists: PropTypes.bool.isRequired,
  saveHrefForm: PropTypes.func.isRequired,
  hrefFormDirty: PropTypes.bool.isRequired
};

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
    schemaExists: !!revision.output_schema_id,
    hrefFormDirty,
    hrefs,
    inProgress: !!source && (!source.finished_at && !source.failed_at)
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    goHome: () => browserHistory.push(Links.revisionBase(ownProps.params)),
    saveHrefForm: andExit => {
      dispatch(FormActions.setShouldExit('hrefForm', !!andExit));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ShowSource);
