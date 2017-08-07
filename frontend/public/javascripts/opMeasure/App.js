import React, { Component } from 'react';
import { connect } from 'react-redux';

import InfoPane from './components/InfoPane';
import PaneTabs from './components/PaneTabs';
import SummaryPane from './components/SummaryPane';
import MetadataPane from './components/MetadataPane';
import ReportingPeriodSelector from './components/ReportingPeriodSelector';
import MetricCard from './components/MetricCard';

export class App extends Component {
  render() {
    return (
      <div>
        <InfoPane />
        <div className="measure-content">
          <div className="measure-panes">
            <PaneTabs />
            <SummaryPane />
            <MetadataPane />
          </div>

          <div className="measure-sidebar">
            <ReportingPeriodSelector />
            <MetricCard />
          </div>
        </div>
      </div>
    );
  }
}

export default connect()(App);
