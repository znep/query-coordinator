import React, { Children, PropTypes } from 'react';
import breakpoints from './breakpoints';

var Responsive = React.createClass({
  propTypes: {
    children: PropTypes.object.isRequired
  },

  getInitialState() {
    return this.getState();
  },

  componentDidMount() {
    window.addEventListener('resize', this.updateState);
  },

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateState);
  },

  getState() {
    if (window.matchMedia(`(max-width: ${breakpoints.mobile}px)`).matches) {
      return {
        isDesktop: false,
        isTablet: false,
        isMobile: true
      };
    }

    if (window.matchMedia(`(max-width: ${breakpoints.tablet}px)`).matches) {
      return {
        isDesktop: false,
        isTablet: false,
        isMobile: true
      };
    }

    return {
      isDesktop: true,
      isTablet: false,
      isMobile: false
    };
  },

  updateState() {
    var newState = this.getState();
    if (!_.isEqual(newState, this.state)) {
      this.setState(newState);
    }
  },

  render() {
    var state = this.state;

    var children = Children.map(this.props.children, (child) => React.cloneElement(child, state));

    return <div>{children}</div>;
  }
});

export default Responsive;
