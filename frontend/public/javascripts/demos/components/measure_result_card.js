import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { Button } from 'common/components';
import MeasureResultCard from 'common/performance_measures/components/MeasureResultCard';

const sum = {
  dataSourceLensUid: 'mks7-68x2',
  domain: 'dataspace.demo.socrata.com',
  metadata: {
    shortName: 'Sum'
  },
  metricConfig: {
    reportingPeriod: {
      size: 'year',
      type: 'open',
      startDate: '2017-09-01'
    },
    'arguments': {
      column: 'number_2'
    },
    dateColumn: 'date',
    type: 'sum'
  }
};

const count = {
  dataSourceLensUid: 'mks7-68x2',
  domain: 'dataspace.demo.socrata.com',
  metadata: {
    shortName: 'Count'
  },
  metricConfig: {
    reportingPeriod: {
      size: 'year',
      type: 'open',
      startDate: '2017-09-01'
    },
    'arguments': {
      column: 'number_2'
    },
    dateColumn: 'date',
    type: 'count'
  }
};

const noReportingPeriodAvailable = {
  dataSourceLensUid: 'mks7-68x2',
  domain: 'dataspace.demo.socrata.com',
  metadata: {
    shortName: 'No reporting period available'
  },
  metricConfig: {
    reportingPeriod: {
      size: 'year',
      type: 'open',
      startDate: '4017-09-01'
    },
    'arguments': {
      column: 'number_2'
    },
    dateColumn: 'date',
    type: 'count'
  }
};

const reportingPeriodNotConfigured = {
  dataSourceLensUid: 'mks7-68x2',
  domain: 'dataspace.demo.socrata.com',
  metadata: {
    shortName: 'No reporting period configured'
  },
  metricConfig: {
    'arguments': {
      column: 'number_2'
    },
    dateColumn: 'date',
    type: 'count'
  }
};

const divByZero = {
  dataSourceLensUid: 'mks7-68x2',
  domain: 'dataspace.demo.socrata.com',
  metadata: {
    shortName: 'Division by zero'
  },
  metricConfig: {
    type: 'rate',
    reportingPeriod: {
      size: 'year',
      type: 'open',
      startDate: '2017-09-01'
    },
    dateColumn: 'date',
    'arguments': {
      denominatorIncludeNullValues: true,
      fixedDenominator: '0',
      aggregationType: 'sum',
      numeratorColumn: 'number_1'
    }
  }
};

const noCalculation = {
  dataSourceLensUid: 'mks7-68x2',
  domain: 'dataspace.demo.socrata.com',
  metadata: {
    shortName: 'No calculation'
  },
  metricConfig: {
    reportingPeriod: {
      size: 'year',
      type: 'open',
      startDate: '2017-09-01'
    }
  }
};

const noDataSource = {
  metadata: {
    shortName: 'No data source'
  },
  metricConfig: {
    reportingPeriod: {
      size: 'year',
      type: 'open',
      startDate: '2017-09-01'
    }
  }
};

class MeasureResultCardDemo extends Component {
  constructor() {
    super();
    this.state = {
      measure: sum
    };
  }

  pasteMeasure = () => {
    this.setState({
      measure: JSON.parse(prompt('Measure JSON?'))
    });
  }

  buttonFor = (measure) => {
    const onClick = () => {
      this.setState({ measure });
    };

    return <Button onClick={onClick}>{measure.metadata.shortName}</Button>;
  }

  render() {
    const props = {
      measure: this.state.measure
    };

    return (
      <div>
        <Button variant='primary' onClick={this.pasteMeasure}>Paste measure JSON</Button>
        {this.buttonFor(count)}
        {this.buttonFor(sum)}
        {this.buttonFor(noReportingPeriodAvailable)}
        {this.buttonFor(reportingPeriodNotConfigured)}
        {this.buttonFor(divByZero)}
        {this.buttonFor(noCalculation)}
        {this.buttonFor(noDataSource)}
        <div className='styleguide-example'>
          <MeasureResultCard {...props}>Hello!</MeasureResultCard>
        </div>
        <div className='styleguide-code-example'>
          <pre>
{
`const props = ${JSON.stringify(props, null, 2)};
return (<MeasureResultCard {...props} />);
`
}
          </pre>
        </div>
      </div>
    );
  }
}

$(() => {
  ReactDOM.render(
    React.createElement(MeasureResultCardDemo),
    document.getElementById('component-demo')
  );
});
