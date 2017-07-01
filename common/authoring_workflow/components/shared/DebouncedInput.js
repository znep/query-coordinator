import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { INPUT_DEBOUNCE_MILLISECONDS } from '../../constants';
import { setUserActive, setUserIdle } from '../../actions';
import { isUserCurrentlyActive } from '../../selectors/vifAuthoring';

export class DebouncedInput extends React.Component {
  constructor(props) {
    super(props);

    // Radiobuttons and checkboxes uses checked instead of value
    this.usingChecked = props.type === 'checkbox' || props.type === 'radio';

    if (this.usingChecked && _.isUndefined(props.checked)) {
      throw new Error(`DebouncedInput with type="${props.type}" needs "checked" property to be set.`);
    }

    if (!this.usingChecked && _.isUndefined(props.value)) {
      throw new Error(`DebouncedInput with type="${props.type}" needs "value" property to be set.`);
    }

    this.state = {
      value: props.value || '',
      checked: false
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.timeoutId = null;
  }

  handleChange(event) {
    event.persist();

    if (this.usingChecked) {
      this.setState({ checked: event.target.checked });
    } else {
      this.setState({ value: event.target.value });
    }

    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }

    if (!isUserCurrentlyActive(this.props.vifAuthoring)) {
      this.props.onDebouncedInputStart();
    }

    this.timeoutId = setTimeout(() => {
      this.props.onDebouncedInputStop();
      return this.props.onChange(event);
    }, INPUT_DEBOUNCE_MILLISECONDS)
  }

  handleKeyDown(event) {
    // fix EN-16941
    if (this.props.forceEnterKeyHandleChange &&
        'Enter' === event.key) {
      event.preventDefault();
      this.handleChange(event);
    }
  }

  render() {
    const props = _.omit(
      this.props,
      ['onDebouncedInputStart',
       'onDebouncedInputStop',
       'vifAuthoring',
       'forceEnterKeyHandleChange']);

    if (this.usingChecked) {
      return <input {...props} checked={this.state.checked} onChange={this.handleChange}/>;
    } else {
      return <input {...props} value={this.state.value} onChange={this.handleChange} onKeyDown={this.handleKeyDown}/>;
    }
  }
}

DebouncedInput.defaultProps = {
  type: 'text'
};

DebouncedInput.propTypes = {
  value: React.PropTypes.any,
  checked: React.PropTypes.bool,
  onChange: React.PropTypes.func.isRequired,
  type: React.PropTypes.string
};

function mapStateToProps(state) {
  return {
    vifAuthoring: state.vifAuthoring
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onDebouncedInputStart: () => {
      dispatch(setUserActive());
    },

    onDebouncedInputStop: () => {
      dispatch(setUserIdle());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DebouncedInput);
