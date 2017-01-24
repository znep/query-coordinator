import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import classNames from 'classnames';
import { openModal } from './actions/modal';
import ExternalResourceContainer from './components/ExternalResourceContainer';
import FormFooter from '../datasetLandingPage/components/FeaturedContentModal/FormFooter';
import Header from './components/Header';
import ResultsContainer from './components/ResultsContainer';

export const AssetSelector = (props) => {
  const onResultsPage = props.modalPage === 'ResultsContainer';

  const assetSelectorContent = (onResultsPage) ?
    <ResultsContainer resultsPerPage={props.resultsPerPage} /> :
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

  // move to footer component
  const selectExternalResource = (e) => {
    console.log(e.target);
  };

  const footer = onResultsPage ?
    null :
    <footer className="modal-footer">{/* TODO: make footer component */}
      <div className="modal-footer-actions">
        <button
          key="cancel"
          className="btn btn-default btn-sm cancel-button"
          onClick={_.noop}>
          Cancel
        </button>

        <button
          key="select"
          className="btn btn-sm btn-primary select-button"
          disabled={false/* TODO */}
          onClick={selectExternalResource}>
          Select
        </button>
      </div>
    </footer>;

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

AssetSelector.propTypes = {
  dispatchOpenModal: PropTypes.func.isRequired,
  modalIsOpen: PropTypes.bool.isRequired,
  modalPage: PropTypes.string.isRequired,
  resultsPerPage: PropTypes.number.isRequired
};

AssetSelector.defaultProps = {
  dispatchOpenModal: _.noop,
  modalIsOpen: false,
  modalPage: 'ResultsContainer',
  resultsPerPage: 6
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

export default connect(mapStateToProps, mapDispatchToProps)(AssetSelector);
