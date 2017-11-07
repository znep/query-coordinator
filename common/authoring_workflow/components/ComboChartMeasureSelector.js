import _ from 'lodash';
import { connect } from 'react-redux';
import BlockLabel from './shared/BlockLabel';
import I18n from 'common/i18n';
import MeasureSelector from './MeasureSelector';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Tabs from './shared/Tabs';
import {
  COMBO_CHART_COLUMN,
  COMBO_CHART_LINE
} from '../constants';

export class ComboChartMeasureSelector extends Component {
  constructor(props) {
    super(props);
    this.state = { tabIndex: 0 };
  }

  renderMeasureSelector() {
    const { series } = this.props;
    let attributes;

    switch (this.state.tabIndex) {
      case ComboChartMeasureSelector.columnTabIndex:
        attributes = {
          key: ComboChartMeasureSelector.columnTabIndex,
          series: _.filter(series, (series) => series.type === COMBO_CHART_COLUMN),
          seriesType: COMBO_CHART_COLUMN
        };
        break;

      case ComboChartMeasureSelector.lineTabIndex:
        attributes = {
          key: ComboChartMeasureSelector.linesTabIndex,
          series: _.filter(series, (series) => series.type === COMBO_CHART_LINE),
          seriesType: COMBO_CHART_LINE
        };
        break;

      default:
        return null;
    }

    return <MeasureSelector {...attributes} />;
  }

  renderTabs() {
    const { tabIndex } = this.state;

    const tabs = [
      {
        iconClassName: 'socrata-icon-bar-chart',
        onClickTab: (tabIndex) => this.setState({ tabIndex }),
        selected: (tabIndex === ComboChartMeasureSelector.columnTabIndex),
        tabIndex: ComboChartMeasureSelector.columnTabIndex,
        title: I18n.translate('shared.visualizations.panes.data.fields.combo_chart_measure_selector.column')
      },
      {
        iconClassName: 'socrata-icon-line-chart',
        onClickTab: (tabIndex) => this.setState({ tabIndex }),
        selected: (tabIndex === ComboChartMeasureSelector.lineTabIndex),
        tabIndex: ComboChartMeasureSelector.lineTabIndex,
        title: I18n.translate('shared.visualizations.panes.data.fields.combo_chart_measure_selector.line')
      }
    ];

    return (
      <Tabs tabs={tabs} />
    );
  }

  render() {
    return (
      <div>
        {this.renderTabs()}
        {this.renderMeasureSelector()}
      </div>
    );
  }
}

ComboChartMeasureSelector.columnTabIndex = 0;
ComboChartMeasureSelector.lineTabIndex = 1;

ComboChartMeasureSelector.propTypes = {
  vifAuthoring: PropTypes.object
};

function mapStateToProps(state) {
  return _.pick(state, ['vifAuthoring']);
}

export default connect(mapStateToProps)(ComboChartMeasureSelector);
