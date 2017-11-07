import _ from 'lodash';
import { connect } from 'react-redux';
import I18n from 'common/i18n';
import React, { Component } from 'react';
import MeasureAxisOptions from './MeasureAxisOptions';
import Tabs from './shared/Tabs';
import {
  setMeasureAxisMaxValue,
  setMeasureAxisMinValue,
  setSecondaryMeasureAxisMaxValue,
  setSecondaryMeasureAxisMinValue
} from '../actions';
import {
  getMeasureAxisMaxValue,
  getMeasureAxisMinValue,
  getSecondaryMeasureAxisMaxValue,
  getSecondaryMeasureAxisMinValue,
  getUseSecondaryAxis
} from '../selectors/vifAuthoring';

export class MeasureAxisOptionsDual extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isPrimaryAxisAutomatic: this.isPrimaryAxisAutomatic(),
      isSecondaryAxisAutomatic: this.isSecondaryAxisAutomatic(),
      tabIndex: 0
    };
  }

  componentWillReceiveProps(nextProps) {
    const isSecondaryAxisAutomatic = !getUseSecondaryAxis(nextProps.vifAuthoring);

    if (isSecondaryAxisAutomatic) {
      this.setState({ isSecondaryAxisAutomatic });
    }
  }

  onMaxValueTextboxChange(event) {
    const {
      onPrimaryMeasureAxisMaxValueTextboxChange,
      onSecondaryMeasureAxisMaxValueTextboxChange
    } = this.props;

    if (this.isPrimaryAxis()) {
      onPrimaryMeasureAxisMaxValueTextboxChange(event);
    } else {
      onSecondaryMeasureAxisMaxValueTextboxChange(event);
    }
  }

  onMinValueTextboxChange(event) {
    const {
      onPrimaryMeasureAxisMinValueTextboxChange,
      onSecondaryMeasureAxisMinValueTextboxChange
    } = this.props;

    if (this.isPrimaryAxis()) {
      onPrimaryMeasureAxisMinValueTextboxChange(event);
    } else {
      onSecondaryMeasureAxisMinValueTextboxChange(event);
    }
  }

  onRadioButtonChange(event) {
    const {
      onPrimaryMeasureAxisAutomaticSelected,
      onSecondaryMeasureAxisAutomaticSelected
    } = this.props;

    const isAutomatic = (event.target.value === 'automatic');

    if (this.isPrimaryAxis()) {
      this.setState({ isPrimaryAxisAutomatic: isAutomatic });
    } else {
      this.setState({ isSecondaryAxisAutomatic: isAutomatic });
    }

    if (isAutomatic) {

      if (this.isPrimaryAxis()) {
        onPrimaryMeasureAxisAutomaticSelected();
      } else {
        onSecondaryMeasureAxisAutomaticSelected();
      }
    }
  }

  isPrimaryAxis() {
    return (this.state.tabIndex === MeasureAxisOptionsDual.primaryAxisTabIndex);
  }

  isPrimaryAxisAutomatic() {
    const { vifAuthoring } = this.props;
    const maxValue = getMeasureAxisMaxValue(vifAuthoring);
    const minValue = getMeasureAxisMinValue(vifAuthoring);

    return _.isNull(maxValue) && _.isNull(minValue);
  }

  isSecondaryAxisAutomatic() {
    const { vifAuthoring } = this.props;
    const maxValue = getSecondaryMeasureAxisMaxValue(vifAuthoring);
    const minValue = getSecondaryMeasureAxisMinValue(vifAuthoring);

    return _.isNull(maxValue) && _.isNull(minValue);
  }

  renderMeasureAxisOptions() {
    const { vifAuthoring } = this.props;
    const {
      isPrimaryAxisAutomatic,
      isSecondaryAxisAutomatic,
      tabIndex
    } = this.state;

    const isAutomatic = this.isPrimaryAxis() ? isPrimaryAxisAutomatic : isSecondaryAxisAutomatic;
    const maxLimit = this.isPrimaryAxis() ? getMeasureAxisMaxValue(vifAuthoring) : getSecondaryMeasureAxisMaxValue(vifAuthoring);
    const minLimit = this.isPrimaryAxis() ? getMeasureAxisMinValue(vifAuthoring) : getSecondaryMeasureAxisMinValue(vifAuthoring);
    const disabled = !this.isPrimaryAxis() && !getUseSecondaryAxis(vifAuthoring);

    const attributes = {
      disabled,
      isAutomatic,
      key: tabIndex,
      maxLimit: maxLimit || '',
      minLimit: minLimit || '',
      onMaxValueTextboxChange: (event) => this.onMaxValueTextboxChange(event),
      onMinValueTextboxChange: (event) => this.onMinValueTextboxChange(event),
      onRadioButtonChange: (event) => this.onRadioButtonChange(event)
    };

    return (
      <MeasureAxisOptions {...attributes} />
    );
  }

  renderTab({ title, selected, tabIndex }) {
    const linkAttributes = {
      className: selected ? 'selected' : null,
      onClick: () => this.setState({ tabIndex })
    };

    return (
      <li>
        <a {...linkAttributes}>{title}</a>
      </li>
    );
  }

  renderTabs() {
    const { tabIndex } = this.state;
    const tabs = [
      {
        onClickTab: (tabIndex) => this.setState({ tabIndex }),
        selected: (tabIndex === MeasureAxisOptionsDual.primaryAxisTabIndex),
        tabIndex: MeasureAxisOptionsDual.primaryAxisTabIndex,
        title: I18n.translate('shared.visualizations.panes.data.fields.combo_chart_measure_axis_options.primary_axis')
      },
      {
        onClickTab: (tabIndex) => this.setState({ tabIndex }),
        selected: (tabIndex === MeasureAxisOptionsDual.secondaryAxisTabIndex),
        tabIndex: MeasureAxisOptionsDual.secondaryAxisTabIndex,
        title: I18n.translate('shared.visualizations.panes.data.fields.combo_chart_measure_axis_options.secondary_axis')
      }
    ];

    return (
      <Tabs tabs={tabs} />
    );
  }

  render() {
    return (
      <div className="measure-axis-dual-container">
        {this.renderTabs()}
        {this.renderMeasureAxisOptions()}
      </div>
    );
  }
}

MeasureAxisOptionsDual.primaryAxisTabIndex = 0;
MeasureAxisOptionsDual.secondaryAxisTabIndex = 1;

function mapDispatchToProps(dispatch) {
  return {
    onPrimaryMeasureAxisMaxValueTextboxChange: (event) => {
      dispatch(setMeasureAxisMaxValue(event.target.value));
    },

    onPrimaryMeasureAxisMinValueTextboxChange: (event) => {
      dispatch(setMeasureAxisMinValue(event.target.value));
    },

    onPrimaryMeasureAxisAutomaticSelected: () => {
      dispatch(setMeasureAxisMaxValue());
      dispatch(setMeasureAxisMinValue());
    },

    onSecondaryMeasureAxisMaxValueTextboxChange: (event) => {
      dispatch(setSecondaryMeasureAxisMaxValue(event.target.value));
    },

    onSecondaryMeasureAxisMinValueTextboxChange: (event) => {
      dispatch(setSecondaryMeasureAxisMinValue(event.target.value));
    },

    onSecondaryMeasureAxisAutomaticSelected: () => {
      dispatch(setSecondaryMeasureAxisMaxValue());
      dispatch(setSecondaryMeasureAxisMinValue());
    }
  };
}

function mapStateToProps(state) {
  return _.pick(state, ['vifAuthoring']);
}

export default connect(mapStateToProps, mapDispatchToProps)(MeasureAxisOptionsDual);
