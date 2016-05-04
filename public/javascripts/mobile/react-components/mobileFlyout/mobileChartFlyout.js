import React from 'react';
import './mobileChartFlyout.scss';
import _ from 'lodash';

class MobileChartFlyout extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      title: this.props.title,
      filteredValue: this.props.filteredValue,
      unFilteredValue: this.props.unFilteredValue,
      arrowPosition: this.props.arrowPosition,
      unit: this.props.unit
    };
  }

  unFilteredLine() {
    return <div className="text-right total-values">
      <span className="value-title">Total&nbsp;</span>
      { this.state.unFilteredValue }
      <span className="value-unit">&nbsp;{ this.state.unFilteredValue > 1 ? this.state.unit.other : this.state.unit.one }</span>
    </div>;
  }

  filteredLine() {
    return <div className="text-right filtered-values">
      <span className="value-title">Filtered&nbsp;</span>
      { this.state.filteredValue }
      <span className="value-unit">&nbsp;{ this.state.filteredValue > 1 ? this.state.unit.other : this.state.unit.one }</span>
    </div>;
  }

  render() {
    let valuesStyleClass = _.isNumber(this.state.filteredValue) ? 'values filtered' : 'values unfiltered';
    let arrowStyle = {
      left: '{0}px'.format(this.state.arrowPosition)
    };

    return <div className="mobile-chart-flyout">
      <div className="arrow" style={ arrowStyle }></div>
      <div className="title">{ this.state.title }</div>
      <div className={ valuesStyleClass }>
        { this.unFilteredLine() }
        { _.isNumber(this.state.filteredValue) ? this.filteredLine() : '' }
      </div>
    </div>;
  }
}

MobileChartFlyout.propTypes = {};

export default MobileChartFlyout;
