import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames/bind';

class Flyout extends React.Component {
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
    var padding = 10;

    var node = ReactDOM.findDOMNode(this.refs.hoverable);
    var left = 0;
    var top = 0;

    var parent = node;
    do {
      left += parent.offsetLeft;
      top += parent.offsetTop;
    } while ((parent = parent.offsetParent) !== null);

    left += node.offsetWidth / 2;
    top += node.offsetHeight + padding;

    const styleDirection = this.props.left ? 'right' : 'left';
    const styleAbove = this.props.tooltip ? 'bottom' : 'top';

    if (this.props.tooltip) {
      left -= 22;
      top -= node.offsetHeight + padding + 10;
      top = window.innerHeight - top;
    } else if (this.props.left) {
      left = window.innerWidth - left;
    }

    this.setState({
      hidden: false,
      style: {
        [styleDirection]: left + 'px',
        [styleAbove]: top + 'px'
      }
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

export default Flyout;
