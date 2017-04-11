import React from 'react';

import ActivityFeedTable from './components/ActivityFeedTable';

import './App.scss';

export default class App extends React.Component {
  render() {
    // TODO: Add filter / tabs header
    return (
      <div>
        <ActivityFeedTable />
      </div>
    );
  }
}
