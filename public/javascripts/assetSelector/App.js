import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import BackButton from './components/BackButton';
import Header from './components/Header';
import ResultsContainer from './components/ResultsContainer';

export const App = (props) => (
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
);

App.propTypes = {
  modalIsOpen: PropTypes.bool.isRequired
};

App.defaultProps = {
  modalIsOpen: true
};

function mapStateToProps(state) {
  return {
    modalIsOpen: _.get(state, 'modal.modalIsOpen')
  };
}

export default connect(mapStateToProps)(App);
