import React, { Component } from 'react';
import { connect } from 'react-redux';

// "Big Number" representation of the metric calculation.
export class MetricCard extends Component {
  render() {
    return (
      <div className="metric-card">
        <div className="metric-card-header">
          Property Crime Rate Per 1,000 Population
        </div>
        <div className="metric-card-content">

        </div>
      </div>
    );
  }
}

export default connect()(MetricCard);
