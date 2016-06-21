import React from 'react';
import classNames from 'classnames/bind';

class Flyout extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hidden: true,
      style: {}
    };
  }

  onMouseEnter() {
    var padding = 10;

    var node = this.refs.hoverable;
    var left = 0;
    var top = 0;

    do {
      left += node.offsetLeft;
      top += node.offsetTop;
    } while ((node = node.offsetParent) !== null);

    left = left + this.refs.hoverable.offsetWidth / 2;
    top = top + this.refs.hoverable.offsetHeight + padding;

    this.setState({
      hidden: false,
      style: {
        left: left + 'px',
        top: top + 'px'
      }
    });
  }

  onMouseLeave() {
    this.setState({
      hidden: true
    });
  }

  render() {
    let flyoutClass = classNames('flyout', {'flyout-hidden': this.state.hidden});

    const childrenWithProps = React.Children.map(this.props.children,
      child => React.cloneElement(child, {
        ref: 'hoverable',
        onMouseEnter: this.onMouseEnter.bind(this),
        onMouseLeave: this.onMouseLeave.bind(this)
      }));

    return <div className="flyout-container">
      { childrenWithProps }
      <div ref="flyout" className={ flyoutClass } style={ this.state.style }>
        <section className="flyout-content">
          <p>{ this.props.text }</p>
        </section>
      </div>
    </div>;
  }
}

export default Flyout;
