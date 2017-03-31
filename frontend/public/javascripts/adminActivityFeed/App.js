import React from 'react';

import ActivityFeedTable from './components/ActivityFeedTable';
import Error from './components/Error';

import './App.scss';

export default class App extends React.Component {
  render() {
    // TODO: Add filter / tabs header
    return (
      <div>
        <Error />
        <ActivityFeedTable />
      </div>
    );
  }
}
