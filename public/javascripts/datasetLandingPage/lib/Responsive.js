import React, { Children } from 'react';
import breakpoints from './breakpoints';

var Responsive = React.createClass({
  getInitialState: function() {
    return this.getState();
  },

  componentDidMount: function() {
    window.addEventListener('resize', this.updateState);
  },

  componentWillUnmount: function() {
    window.removeEventListener('resize', this.updateState);
  },

  updateState: function() {
    this.setState(this.getState());
  },

  getState: function() {
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

  render: function() {
    var state = this.state;

    var children = Children.map(this.props.children, function(child) {
      return React.cloneElement(child, state);
    });

    return <div>{children}</div>;
  }
});

export default Responsive;
