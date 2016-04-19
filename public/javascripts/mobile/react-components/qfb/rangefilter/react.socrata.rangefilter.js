import React from 'react';

import $ from 'jquery'; // eslint-disable-line
import InputRange from 'react-input-range';
import './rangefilter.scss';
// import FlannelUtils from '../../flannel/flannel';

class SocrataRangeFilter extends React.Component {

  constructor(props) {
    super(props);

    this.domain = this.props.domain;

    this.state = {
      values: {
        min: 0,
        max: this.domain.length - 1
      },
      valueLabels: {
        min: 'No Min',
        max: 'No Max'
      }
    };
  }

  handleValuesChange(component, values) {
    var labelsObject = {
      min: (values.min == 0) ? 'No Min' : this.domain[values.min],
      max: (values.max == this.domain.length - 1) ? 'No Max' : this.domain[values.max]
    };

    this.setState({
      values: values,
      valueLabels: labelsObject
    });
  }

  render() {
    return (<div>
      <InputRange
            minValue={ 0 }
            maxValue={ this.domain.length - 1 }
            step={1}
            value={ this.state.values }
            onChange={ this.handleValuesChange.bind(this) } />
      <div className="rangeLabels">
        <div>{ this.state.valueLabels.min }</div>
        <div>{ this.state.valueLabels.max }</div>
      </div>
    </div>);
  }

}

export default SocrataRangeFilter;
