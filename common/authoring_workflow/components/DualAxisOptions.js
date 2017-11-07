import _ from 'lodash';
import classNames from 'classnames';
import { connect } from 'react-redux';
import I18n from 'common/i18n';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Tabs from './shared/Tabs';
import {
  setSecondaryMeasureAxisMaxValue,
  setSecondaryMeasureAxisMinValue,
  setUseSecondaryAxisForColumns,
  setUseSecondaryAxisForLines
} from '../actions';

import {
  getUseSecondaryAxisForColumns,
  getUseSecondaryAxisForLines
} from '../selectors/vifAuthoring';

export class DualAxisOptions extends Component {
  constructor(props) {
    super(props);
    this.state = { tabIndex: 0 };
  }

  onRadioButtonChange({ useSecondaryAxis }) {
    const {
      onSecondaryMeasureAxisAutomaticSelected,
      onSelectColumnAxis,
      onSelectLineAxis,
      vifAuthoring
    } = this.props;
    const { tabIndex } = this.state;

    switch (tabIndex) {
      case DualAxisOptions.columnTabIndex:
        onSelectColumnAxis({ useSecondaryAxis });
        break;
      case DualAxisOptions.lineTabIndex:
        onSelectLineAxis({ useSecondaryAxis });
        break;
    }

    if (tabIndex === DualAxisOptions.columnTabIndex) {
      if (!useSecondaryAxis && !getUseSecondaryAxisForLines(vifAuthoring)) {
        onSecondaryMeasureAxisAutomaticSelected();
      }
    } else if (tabIndex === DualAxisOptions.lineTabIndex) {
      if (!useSecondaryAxis && !getUseSecondaryAxisForColumns(vifAuthoring)) {
        onSecondaryMeasureAxisAutomaticSelected();
      }
    }
  }

  getSecondaryAxisChecked() {
    const { vifAuthoring } = this.props;

    switch (this.state.tabIndex) {
      case DualAxisOptions.columnTabIndex:
        return getUseSecondaryAxisForColumns(vifAuthoring);
      case DualAxisOptions.lineTabIndex:
        return getUseSecondaryAxisForLines(vifAuthoring);
      default:
        return false;
    }
  }

  getSecondaryAxisDisabled() {
    const { vifAuthoring } = this.props;

    switch (this.state.tabIndex) {
      case DualAxisOptions.columnTabIndex:
        return getUseSecondaryAxisForLines(vifAuthoring);
      case DualAxisOptions.lineTabIndex:
        return getUseSecondaryAxisForColumns(vifAuthoring);
      default:
        return false;
    }
  }

  renderTab({ iconClassName, selected, tabIndex, title }) {
    const linkAttributes = {
      className: selected ? 'selected' : null,
      onClick: () => this.setState({ tabIndex })
    };

    return (
      <li>
        <a {...linkAttributes}>
          <span className={iconClassName}></span>
          {title}
        </a>
      </li>
    );
  }

  renderAxisRadioButton({ checked, className, id, onChange, title }) {
    const inputAttributes = {
      checked,
      id,
      onChange,
      name: 'dual-axis-options',
      type: 'radio'
    };

    return (
      <div className={className}>
        <input {...inputAttributes} />
        <label htmlFor={id}>
          <span className="fake-radiobutton" />
          <div className="translation-within-label">{title}</div>
        </label>
      </div>
    );
  }

  renderRadioButtons() {
    const secondaryAxisChecked = this.getSecondaryAxisChecked();

    const primaryAxisRadioButton = this.renderAxisRadioButton({
      checked: !secondaryAxisChecked,
      className: 'primary-axis-container',
      id: 'dual-axis-primary',
      onChange: () => this.onRadioButtonChange({ useSecondaryAxis: false }),
      title: I18n.t('shared.visualizations.panes.data.fields.dual_axis_options.primary_axis')
    });

    const secondaryAxisRadioButton = this.renderAxisRadioButton({
      checked: secondaryAxisChecked,
      className: 'secondary-axis-container',
      id: 'dual-axis-secondary',
      onChange: () => this.onRadioButtonChange({ useSecondaryAxis: true }),
      title: I18n.t('shared.visualizations.panes.data.fields.dual_axis_options.secondary_axis')
    });

    return (
      <div className="authoring-field radiobutton">
        {primaryAxisRadioButton}
        {secondaryAxisRadioButton}
      </div>
    );
  }

  renderTabs() {
    const { tabIndex } = this.state;
    const tabs = [
      {
        iconClassName: 'socrata-icon-bar-chart',
        onClickTab: (tabIndex) => this.setState({ tabIndex }),
        selected: (tabIndex === DualAxisOptions.columnTabIndex),
        tabIndex: DualAxisOptions.columnTabIndex,
        title: I18n.translate('shared.visualizations.panes.data.fields.dual_axis_options.column')
      },
      {
        iconClassName: 'socrata-icon-line-chart',
        onClickTab: (tabIndex) => this.setState({ tabIndex }),
        selected: (tabIndex === DualAxisOptions.lineTabIndex),
        tabIndex: DualAxisOptions.lineTabIndex,
        title: I18n.translate('shared.visualizations.panes.data.fields.dual_axis_options.line')
      }
    ];

    return (
      <Tabs tabs={tabs} />
    );
  }

  render() {
    return (
      <div className="dual-axis-container">
        {this.renderTabs()}
        {this.renderRadioButtons()}
      </div>
    );
  }
}

DualAxisOptions.columnTabIndex = 0;
DualAxisOptions.lineTabIndex = 1;

DualAxisOptions.propTypes = {
  vifAuthoring: PropTypes.object
};

function mapDispatchToProps(dispatch) {
  return {
    onSelectColumnAxis: ({ useSecondaryAxis }) => {
      dispatch(setUseSecondaryAxisForColumns(useSecondaryAxis));
    },

    onSelectLineAxis: ({ useSecondaryAxis }) => {
      dispatch(setUseSecondaryAxisForLines(useSecondaryAxis));
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

export default connect(mapStateToProps, mapDispatchToProps)(DualAxisOptions);
