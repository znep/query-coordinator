import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import classNames from 'classnames';
import { openModal } from './actions/modal';
import ExternalResourceContainer from './components/ExternalResourceContainer';
import FormFooter from '../datasetLandingPage/components/FeaturedContentModal/FormFooter';
import Header from './components/Header';
import ResultsContainer from './components/ResultsContainer';

export const App = (props) => {
  const onResultsPage = props.modalPage === 'ResultsContainer';

  const assetSelectorContent = (onResultsPage) ?
    <ResultsContainer resultsPerPage={6} /> :
    <ExternalResourceContainer />;

  const assetSelectorModalClassNames = classNames({
    'asset-selector-modal': true,
    'modal': true,
    'modal-full': true,
    'modal-hidden': !props.modalIsOpen
  });

  const modalContainerClassNames = classNames({
    'modal-container': true,
    'no-footer': onResultsPage
  });

  /* TODO: Localization, [category] */
  const headerTitle = onResultsPage ?
    'Select Featured Content in [category]' :
    'Feature an External Resource';

  const footer = onResultsPage ?
    null :
    <FormFooter
      cancelText={'Cancel'}
      canSave={true}
      displaySaveButton={true}
      isSaved={false}
      isSaving={false}
      onClickCancel={_.noop}
      onClickSave={_.noop}
      saveText={'Save'}
      savedText={'Saved!'} />;

  const demoDivStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    width: '300px',
    border: '1px dashed #999',
    margin: '1rem'
  };

  return (
    <div>
      {/* TODO: these button should be outside the Asset Selector */}
      {[...Array(3)].map((x, i) => (
        <div style={demoDivStyle} key={i}>
          <button
            className="btn btn-primary"
            onClick={props.dispatchOpenModal}>
            Add...
          </button>
        </div>
      ))}

      <div
        className={assetSelectorModalClassNames}
        data-modal-dismiss>
        <div className={modalContainerClassNames}>
          <Header title={headerTitle} />
          {assetSelectorContent}
          {footer}
        </div>
      </div>
    </div>
  );
};

App.propTypes = {
  dispatchOpenModal: PropTypes.func.isRequired,
  modalIsOpen: PropTypes.bool.isRequired,
  modalPage: PropTypes.string.isRequired
};

App.defaultProps = {
  dispatchOpenModal: _.noop,
  modalIsOpen: false,
  modalPage: 'ResultsContainer'
};

function mapStateToProps(state) {
  return {
    modalPage: _.get(state, 'modal.modalPage'),
    modalIsOpen: _.get(state, 'modal.modalIsOpen')
  };
}

function mapDispatchToProps(dispatch) {
  return {
    dispatchOpenModal: function() {
      dispatch(openModal());
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
