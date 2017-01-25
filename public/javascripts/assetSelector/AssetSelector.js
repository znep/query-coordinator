import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import classNames from 'classnames';
import { openModal, closeModal } from './actions/modal';
import ExternalResourceContainer from './components/ExternalResourceContainer';
import Header from './components/Header';
import Footer from './components/Footer';
import ResultsContainer from './components/ResultsContainer';

export const AssetSelector = (props) => {
  const onResultsPage = props.modalPage === 'ResultsContainer';

  const assetSelectorContent = (onResultsPage) ?
    <ResultsContainer
      category={props.category}
      resultsPerPage={props.resultsPerPage} /> :
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

  const selectExternalResource = () => {
    const result = {
      resourceType: 'external',
      ...props.externalResourceContent
    };
    console.log(result); // TODO: provide this for parent component using AssetSelector
    props.dispatchCloseModal();
  };

  // Form is invalid if any of its fields are invalid
  const externalResourceFormIsInvalid = !_.isEmpty(_.find(props.externalResourceContent, { invalid: true }));

  const footer = onResultsPage ? null :
    <Footer
      onSelect={selectExternalResource}
      selectIsDisabled={externalResourceFormIsInvalid} />;

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
  category: PropTypes.string,
  dispatchOpenModal: PropTypes.func.isRequired,
  dispatchCloseModal: PropTypes.func.isRequired,
  externalResourceContent: PropTypes.object.isRequired,
  externalResourceTitle: PropTypes.string.isRequired,
  modalIsOpen: PropTypes.bool.isRequired,
  modalPage: PropTypes.string.isRequired,
  resultsPerPage: PropTypes.number.isRequired
};

AssetSelector.defaultProps = {
  category: null,
  dispatchOpenModal: _.noop,
  dispatchCloseModal: _.noop,
  externalResourceContent: {},
  externalResourceTitle: '',
  modalIsOpen: false,
  modalPage: 'ResultsContainer',
  resultsPerPage: 6
};

function mapStateToProps(state) {
  return {
    externalResourceContent: _.get(state, 'externalResource'),
    externalResourceTitle: _.get(state, 'externalResource.title.value'),
    modalPage: _.get(state, 'modal.modalPage'),
    modalIsOpen: _.get(state, 'modal.modalIsOpen')
  };
}

function mapDispatchToProps(dispatch) {
  return {
    dispatchOpenModal: function() {
      dispatch(openModal());
    },
    dispatchCloseModal: function() {
      dispatch(closeModal());
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AssetSelector);
