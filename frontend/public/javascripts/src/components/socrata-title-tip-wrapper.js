import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';

const socrataTitleTipWrapper = (ComposedComponent) => {
  class Wrapped extends Component {
    componentDidMount() {
      this.setupTooltip();
    }
    componentWillUpdate() {
      this.destroyTooltip();
    }
    componentDidUpdate() {
      this.setupTooltip();
    }
    componentWillUnmount() {
      this.destroyTooltip();
    }
    setupTooltip() {
      const node = ReactDOM.findDOMNode(this);
      if (this.props.title) { $(node).socrataTitleTip(); }
    }
    destroyTooltip() {
      const node = ReactDOM.findDOMNode(this);
      const socrataTip = $(node).removeAttr('bt-xtitle').data('socrataTip');
      if (socrataTip) { socrataTip.destroy(); }
    }
    render() {
      return (<ComposedComponent {...this.props} />);
    }
  }

  Wrapped.propTypes = {
    title: PropTypes.string
  };

  return Wrapped;
};

export default socrataTitleTipWrapper;
