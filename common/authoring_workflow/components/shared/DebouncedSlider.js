import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Slider } from 'common/components';
import { INPUT_DEBOUNCE_MILLISECONDS } from '../../constants';
import { setUserActive, setUserIdle } from '../../actions';
import { isUserCurrentlyActive } from '../../selectors/vifAuthoring';

export class DebouncedSlider extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: props.value
    };

    this.timeoutId = null;
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(value) {
    this.setState(
      { value },
      () => {
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
        }

        if (!isUserCurrentlyActive(this.props.vifAuthoring)) {
          this.props.onDebouncedInputStart();
        }

        this.timeoutId = setTimeout(() => {
          this.props.onDebouncedInputStop();
          return this.props.onChange(this.state.value);
        }, INPUT_DEBOUNCE_MILLISECONDS);
      }
    );
  }

  render() {
    const props = _.omit(this.props, ['value', 'onChange', 'onDebouncedInputStart', 'onDebouncedInputStop', 'vifAuthoring']);
    return <Slider {...props} value={this.state.value} onChange={this.handleChange} />;
  }
}

DebouncedSlider.propTypes = {
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired
};

DebouncedSlider.defaultProps = {
  disabled: false
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
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DebouncedSlider);
