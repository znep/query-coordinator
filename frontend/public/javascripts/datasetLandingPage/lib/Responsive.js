import PropTypes from 'prop-types';
import React, { Children, Component } from 'react';
import breakpoints from './breakpoints';

class Responsive extends Component {
  constructor(props) {
    super(props);

    this.state = this.getState();

    _.bindAll(this, 'updateState');
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateState);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateState);
  }

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
        isTablet: true,
        isMobile: false
      };
    }

    return {
      isDesktop: true,
      isTablet: false,
      isMobile: false
    };
  }

  updateState() {
    const newState = this.getState();
    if (!_.isEqual(newState, this.state)) {
      this.setState(newState);
    }
  }

  render() {
    const state = this.state;

    const children = Children.map(this.props.children, (child) => React.cloneElement(child, state));

    return <div>{children}</div>;
  }
}

Responsive.propTypes = {
  children: PropTypes.object.isRequired
};

export default Responsive;
