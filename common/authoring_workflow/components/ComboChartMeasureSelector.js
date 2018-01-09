import _ from 'lodash';
import { connect } from 'react-redux';
import BlockLabel from './shared/BlockLabel';
import I18n from 'common/i18n';
import MeasureSelector from './MeasureSelector';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Tabs from './shared/Tabs';
import {
  SERIES_TYPE_COMBO_CHART_COLUMN,
  SERIES_TYPE_COMBO_CHART_LINE,
  SERIES_VARIANT_COLUMN,
  SERIES_VARIANT_LINE
} from '../constants';
import { isPieChart } from '../selectors/vifAuthoring';

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
          isFlyoutSeries: false,
          key: ComboChartMeasureSelector.columnTabIndex,
          listItemKeyPrefix: SERIES_TYPE_COMBO_CHART_COLUMN,
          series: _.filter(series, (series) => series.type === SERIES_TYPE_COMBO_CHART_COLUMN),
          seriesVariant: SERIES_VARIANT_COLUMN,
          shouldRenderAddMeasureLink: true,
          shouldRenderDeleteMeasureLink: (series.length > 1)
        };
        break;

      case ComboChartMeasureSelector.lineTabIndex:
        attributes = {
          isFlyoutSeries: false,
          key: ComboChartMeasureSelector.linesTabIndex,
          listItemKeyPrefix: SERIES_TYPE_COMBO_CHART_LINE,
          series: _.filter(series, (series) => series.type === SERIES_TYPE_COMBO_CHART_LINE),
          seriesVariant: SERIES_VARIANT_LINE,
          shouldRenderAddMeasureLink: true,
          shouldRenderDeleteMeasureLink: (series.length > 1)
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
