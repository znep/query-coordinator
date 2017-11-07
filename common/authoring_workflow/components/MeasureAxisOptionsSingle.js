import _ from 'lodash';
import { connect } from 'react-redux';
import React, { Component } from 'react';
import MeasureAxisOptions from './MeasureAxisOptions';
import {
  setMeasureAxisMaxValue,
  setMeasureAxisMinValue
} from '../actions';
import {
  getMeasureAxisMaxValue,
  getMeasureAxisMinValue,
  isOneHundredPercentStacked
} from '../selectors/vifAuthoring';

export class MeasureAxisOptionsSingle extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isAutomatic: this.isAutomatic()
    };
  }

  onRadioButtonChange(event) {
    const isAutomatic = (event.target.value === 'automatic');

    this.setState({
      isAutomatic
    });

    if (isAutomatic) {
      this.props.onMeasureAxisAutomaticSelected();
    }
  }

  isAutomatic() {
    const { vifAuthoring } = this.props;
    const maxValue = getMeasureAxisMaxValue(vifAuthoring);
    const minValue = getMeasureAxisMaxValue(vifAuthoring);

    return _.isNull(maxValue) && _.isNull(minValue);
  }

  render() {
    const {
      onMaxValueTextboxChange,
      onMinValueTextboxChange,
      vifAuthoring
    } = this.props;

    const attributes = {
      disabled: isOneHundredPercentStacked(vifAuthoring),
      isAutomatic: this.state.isAutomatic,
      key: 0,
      maxLimit: getMeasureAxisMaxValue(vifAuthoring) || '',
      minLimit: getMeasureAxisMinValue(vifAuthoring) || '',
      onMaxValueTextboxChange,
      onMinValueTextboxChange,
      onRadioButtonChange: (event) => this.onRadioButtonChange(event)
    };

    return (
      <MeasureAxisOptions {...attributes} />
    );
  }
}

function mapDispatchToProps(dispatch) {
  return {
    onMaxValueTextboxChange: (event) => {
      dispatch(setMeasureAxisMaxValue(event.target.value));
    },

    onMinValueTextboxChange: (event) => {
      dispatch(setMeasureAxisMinValue(event.target.value));
    },

    onMeasureAxisAutomaticSelected: () => {
      dispatch(setMeasureAxisMaxValue());
      dispatch(setMeasureAxisMinValue());
    }
  };
}

function mapStateToProps(state) {
  return _.pick(state, ['vifAuthoring']);
}

export default connect(mapStateToProps, mapDispatchToProps)(MeasureAxisOptionsSingle);
