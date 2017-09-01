import _ from 'lodash';
import React, { PropTypes } from 'react';

/**
 * This wraps an <input /> inside of a timeout that periodically checks the dom node's value.
 * Use on any field that could be auto-filled, since the browser doesn't send out DOM events
 * and React won't pick up on input changes
 */
class PollingInput extends React.Component {
  constructor(props) {
    super(props);

    this.checkForDomNodeValue = this.checkForDomNodeValue.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentWillMount() {
    this.setState({ interval: window.setInterval(this.checkForDomNodeValue, 500) });
  }

  componentDidMount() {
    if (this.props.focusOnMount === true) {
      this.domNode.focus();
    }
  }

  componentWillUnmount() {
    window.clearInterval(this.state.interval);
  }

  checkForDomNodeValue() {
    const nodeValue = this.domNode.value;
    this.props.onChange({ target: { value: nodeValue } });
  }

  handleChange(event) {
    this.props.onChange(event);
  }

  render() {
    // omit the onChange prop in favor of an onChange that calls handleChange
    const props = _.omit(this.props, ['focusOnMount', 'onChange']);
    return (
      <input
        {...props}
        ref={(domNode) => { this.domNode = domNode; }}
        onChange={this.handleChange} />
    );
  }
}

PollingInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  focusOnMount: PropTypes.bool
};

PollingInput.defaultProps = {
  focusOnMount: false
};

export default PollingInput;
