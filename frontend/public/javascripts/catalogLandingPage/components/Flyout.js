import PropTypes from 'prop-types';
import React from 'react';
import _ from 'lodash';
import classNames from 'classnames';

export default class Flyout extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hidden: true
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
    const { children, left, right, text } = this.props;

    const flyoutClass = classNames('flyout', {
      'flyout-hidden': this.state.hidden,
      'flyout-right': right,
      'flyout-left': left
    });

    const childrenWithProps = React.Children.map(children,
      child => React.cloneElement(child, { ref: 'hoverable' })
    );

    return (
      <div className="flyout-container">
        <span onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
          {childrenWithProps}
        </span>
        <div ref="flyout" className={flyoutClass}>
          <section className="flyout-content">
            <p>{text}</p>
          </section>
        </div>
      </div>
    );
  }
}

Flyout.propTypes = {
  children: PropTypes.object.isRequired,
  left: PropTypes.bool,
  right: PropTypes.bool,
  text: PropTypes.string.isRequired
};

Flyout.defaultProps = {
  left: false,
  right: false
};
