import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { INPUT_DEBOUNCE_MILLISECONDS } from '../../constants';
import { setUserActive, setUserIdle } from '../../actions';
import { isUserCurrentlyActive } from '../../selectors/vifAuthoring';

export class DebouncedTextArea extends React.Component {
  constructor(props) {
    super(props);

    if (_.isUndefined(props.value)) {
      throw new Error(`DebouncedTextArea needs "value" property to be set.`);
    }

    this.state = {
      value: props.value || ''
    };

    this.handleChange = this.handleChange.bind(this);
    this.timeoutId = null;
  }

  handleChange(event) {
    event.persist();
    this.setState({ value: event.target.value });

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

  render() {
    const props = _.omit(this.props, ['onDebouncedInputStart', 'onDebouncedInputStop', 'vifAuthoring']);
    return <textarea {...props} value={this.state.value} onChange={this.handleChange}/>;
  }
}

DebouncedTextArea.propTypes = {
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired
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

export default connect(mapStateToProps, mapDispatchToProps)(DebouncedTextArea);
