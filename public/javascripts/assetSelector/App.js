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
  const assetSelectorContent = (props.modalPage === 'ResultsContainer') ?
    <ResultsContainer resultsPerPage={6} /> :
    <ExternalResourceContainer />;

  const assetSelectorModalClassNames = classNames({
    'asset-selector-modal': true,
    'modal': true,
    'modal-full': true,
    'modal-hidden': !props.modalIsOpen
  });

  /* TODO: Localization, [category] */
  const headerTitle = (props.modalPage === 'ResultsContainer') ?
    'Select Featured Content in [category]' :
    'Feature an External Resource';

  return (
    <div>
      <button
        className="btn btn-primary"
        onClick={props.dispatchOpenModal}>
        Add...
      </button>
      <div
        className={assetSelectorModalClassNames}
        data-modal-dismiss>
        <div className="modal-container">
          <Header title={headerTitle} />
          {assetSelectorContent}
          <FormFooter
            cancelText={'Cancel'}
            canSave={true}
            displaySaveButton={true}
            isSaved={false}
            isSaving={false}
            onClickCancel={_.noop}
            onClickSave={_.noop}
            saveText={'Save'}
            savedText={'Saved!'} />
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
