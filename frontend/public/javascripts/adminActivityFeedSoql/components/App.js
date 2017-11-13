import React, { Component } from 'react';
import Table from './Table';
import Footer from './Footer';

class App extends Component {

  render() {

    return (
      <div>
        <div className="header">

        </div>
        <div className="results-and-filters">
          <div className="catalog-results">
            <Table />
            <Footer />
          </div>
          <div className="catalog-filters">

          </div>
        </div>
      </div>
    );
  }
}

export default App;
