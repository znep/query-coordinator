import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';

const socrataTitleTipWrapper = (Component) => (
  React.createClass({
    displayName: `${Component.displayName}WithTooltip`,
    propTypes: {
      title: PropTypes.string
    },
    componentDidMount() {
      this.setupTooltip();
    },
    componentWillUpdate() {
      this.destroyTooltip();
    },
    componentDidUpdate() {
      this.setupTooltip();
    },
    componentWillUnmount() {
      this.destroyTooltip();
    },
    setupTooltip() {
      const node = ReactDOM.findDOMNode(this);
      if (this.props.title) { $(node).socrataTitleTip(); }
    },
    destroyTooltip() {
      const node = ReactDOM.findDOMNode(this);
      const socrataTip = $(node).removeAttr('bt-xtitle').data('socrataTip');
      if (socrataTip) { socrataTip.destroy(); }
    },
    render() {
      return (<Component {...this.props} />);
    }
  })
);

export default socrataTitleTipWrapper;
