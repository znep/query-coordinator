import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import { openModal } from './actions/modal';
import BackButton from './components/BackButton';
import Header from './components/Header';
import ResultsContainer from './components/ResultsContainer';

export const App = (props) => (
  <div>
    <button
      className="btn btn-primary"
      onClick={props.dispatchOpenModal}>
      Add...
    </button>
    <div className={props.modalIsOpen ? '' : 'hidden'}>
      <div className="asset-selector-overlay">
        <div className="content">
          <Header />
          <div className="centered-content">
            <BackButton />
            <ResultsContainer resultsPerPage={6} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

App.propTypes = {
  dispatchOpenModal: PropTypes.func.isRequired,
  modalIsOpen: PropTypes.bool.isRequired
};

App.defaultProps = {
  dispatchOpenModal: _.noop,
  modalIsOpen: false
};

function mapStateToProps(state) {
  return {
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
