import _ from 'lodash';
import React from 'react';
import classNames from 'classnames/bind';
import './SocrataFlyout.scss';

export default class SocrataFlyout extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hidden: true,
      style: {}
    };

    _.bindAll(this, [
      'onMouseLeave',
      'onMouseEnter'
    ]);
  }

  onMouseEnter() {
    this.setState({
      hidden: false
    });
  }

  onMouseLeave() {
    this.setState({
      hidden: true
    });
  }

  render() {
    let flyoutClass = classNames('flyout', {
      'flyout-hidden': this.state.hidden,
      'flyout-right': !this.props.left,
      'flyout-left': this.props.left,
      'flyout-tooltip': this.props.tooltip
    });

    const childrenWithProps = React.Children.map(this.props.children,
      child => React.cloneElement(child, {
        ref: 'hoverable'
      }));

    return <div className="flyout-container">
      <span onMouseEnter={ this.onMouseEnter } onMouseLeave={ this.onMouseLeave }>{ childrenWithProps }</span>
      <div ref="flyout" className={ flyoutClass } style={ this.state.style }>
        <section className="flyout-content">
          <p>{ this.props.text }</p>
        </section>
      </div>
    </div>;
  }
}
