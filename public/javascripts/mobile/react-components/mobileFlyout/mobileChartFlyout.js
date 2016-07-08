import _ from 'lodash';
import React from 'react';
import classNames from 'classnames/bind';

import './mobileChartFlyout.scss';

class MobileChartFlyout extends React.Component {
  unFilteredLine(props) {
    return <div className="text-right total-values">
      <span className="value-title">Total&nbsp;</span>
      { props.value }
      <span className="value-unit">&nbsp;{ props.value > 1 ? props.unit.other : props.unit.one }</span>
    </div>;
  }

  filteredLine(props) {
    if ( (!props.value && props.value !== 0) || _.isUndefined(props.value) || _.isNull(props.value)) {
      return <div />;
    }

    return <div className="text-right filtered-values">
      <span className="value-title">Filtered&nbsp;</span>
      { props.value }
      <span className="value-unit">&nbsp;{ props.value > 1 ? props.unit.other : props.unit.one }</span>
    </div>;
  }

  render() {
    let valuesStyleClass = classNames('values',
      ( this.props.filteredValue === 0 ||
        this.props.filteredValue ||
        _.isUndefined(this.props.filteredValue) ||
        _.isNull(this.props.filteredValue))
        ? ' filtered' : 'unfiltered');

    let arrowStyle = {
      left: '{0}px'.format(this.props.arrowPosition + 29.5)
    };

    let mainClassName = classNames('mobile-flyout', { hidden: !this.props.visible });
    let titleClassName = classNames('title', { italic: this.props.title == '(No Value)' });

    return <div className={ mainClassName }>
      <div className="mobile-chart-flyout">
        <div className="arrow" style={ arrowStyle }></div>
        <div className={ titleClassName }>{ this.props.title }</div>
        <div className={ valuesStyleClass }>
          <this.unFilteredLine value={ this.props.unFilteredValue } unit={ this.props.unit } />
          <this.filteredLine value={ this.props.filteredValue } unit={ this.props.unit } />
        </div>
      </div>
    </div>;
  }
}

MobileChartFlyout.propTypes = {};

export default MobileChartFlyout;
