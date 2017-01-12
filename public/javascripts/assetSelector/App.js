import React, { Component } from 'react';
import BackButton from './components/BackButton';
import Header from './components/Header';
import ResultsContainer from './components/ResultsContainer';

export class App extends Component {
  constructor() {
    super();

    this.state = {
      modalIsOpen: true
    };

    _.bindAll(this, ['openModal', 'closeModal']);
  }

  openModal() {
    this.setState({ modalIsOpen: true });
  }

  closeModal() {
    this.setState({ modalIsOpen: false });
  }

  render() {
    return (
      <div className={this.state.modalIsOpen ? '' : 'hidden'}>
        <div className="overlay">
          <div className="content">
            <Header />
            <div className="centered-content">
              <BackButton onClick={this.closeModal} />
              <ResultsContainer />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
