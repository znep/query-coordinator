import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import { openModal } from './actions/modal';
import ExternalResourceContainer from './components/ExternalResourceContainer';
import ResultsContainer from './components/ResultsContainer';

export const App = (props) => {
  const modalContent = (props.modalPage === 'ResultsContainer') ?
    <ResultsContainer resultsPerPage={6} /> :
    <ExternalResourceContainer />;

  return (
    <div>
      <button
        className="btn btn-primary"
        onClick={props.dispatchOpenModal}>
        Add...
      </button>
      <div className={props.modalIsOpen ? '' : 'hidden'}>
        <div className="asset-selector-overlay">
          <div className="content">
            {modalContent}
          </div>
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
