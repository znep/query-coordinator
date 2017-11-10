import React, { Component } from 'react';
import Table from './Table';
import Footer from './Footer';
import Tabs from './Tabs';

class App extends Component {

  render() {

    return (
      <div>
        <div className="header">
          <Tabs />
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
