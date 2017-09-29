import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ColorPicker, Dropdown } from 'common/components';
import I18n from 'common/i18n';
import { CHART_SORTING, COLORS } from '../../constants';
import {
  appendReferenceLine,
  removeReferenceLine,
  setReferenceLineColor,
  setReferenceLineLabel,
  setReferenceLineValue,
  setOrderBy,
  setMeasureAxisMinValue,
  setMeasureAxisMaxValue,
} from '../../actions';
import {
  getAnyDimension,
  getReferenceLines,
  getOrderBy,
  getMeasureAxisMinValue,
  getMeasureAxisMaxValue,
  isBarChart,
  isColumnChart,
  isHistogram,
  isOneHundredPercentStacked,
  isTimelineChart,
  isPieChart
} from '../../selectors/vifAuthoring';
import { isDimensionTypeCalendarDate } from '../../selectors/metadata';
import EmptyPane from './EmptyPane';
import Accordion from '../shared/Accordion';
import AccordionPane from '../shared/AccordionPane';
import DebouncedInput from '../shared/DebouncedInput';
import TextInputButton from '../shared/TextInputButton';

export class AxisAndScalePane extends Component {
  constructor(props) {
    super(props);

    this.state = {
      measureAxisScaleControl: props.measureAxisScaleControl || 'automatic'
    };

    _.bindAll(this, [
      'renderChartSortingOption',
      'renderChartSorting',
      'onMeasureAxisScaleControlChange',
      'renderMeasureAxisScaleControl',
      'renderReferenceLinesControls',
      'renderReferenceLinesControlsAtIndex',
      'renderReferenceLinesLabelTextInputButton',
      'renderReferenceLinesLabelInput',
      'getExpandedStateKey',
      'renderAddReferenceLineLink',
      'renderTimelinePrecisionOption',
      'renderBarChartControls',
      'renderColumnChartControls',
      'renderHistogramControls',
      'renderTimelineChartControls',
      'renderPieChartControls',
      'renderEmptyPane'
    ]);
  }

  renderChartSortingOption(option) {
    return (
      <div className="dataset-column-dropdown-option">
        <span className={option.icon}></span> {option.title}
      </div>
    );
  }

  renderChartSorting() {
    const { metadata, onSelectChartSorting, chartSorting, vifAuthoring } = this.props;
    const column = getAnyDimension(vifAuthoring);

    const defaultChartSort = getOrderBy(vifAuthoring) || { parameter: 'measure', sort: 'desc' };
    const options = _.map(chartSorting, (option) => {
      option.value = `${option.orderBy.parameter}-${option.orderBy.sort}`;
      option.render = this.renderChartSortingOption;

      return option;
    });

    const attributes = {
      options,
      onSelection: onSelectChartSorting,
      id: 'chart-sorting-selection',
      value: `${defaultChartSort.parameter}-${defaultChartSort.sort}`
    };

    return (
      <AccordionPane title={I18n.t('shared.visualizations.panes.axis_and_scale.subheaders.chart_sorting')}>
        <div className="authoring-field">
          <Dropdown {...attributes} />
        </div>
      </AccordionPane>
    );
  }

  onMeasureAxisScaleControlChange(event) {
    this.setState({
      measureAxisScaleControl: event.target.value
    });

    if (event.target.value == 'automatic') {
      this.props.onMeasureAxisControlAuto();
    }
  }

  renderMeasureAxisScaleControl() {
    const {
      vifAuthoring,
      onMeasureAxisMinValueChange,
      onMeasureAxisMaxValueChange
    } = this.props;

    let limitMax = getMeasureAxisMaxValue(vifAuthoring);
    if (_.isNull(limitMax)) {
      limitMax = '';
    }

    let limitMin = getMeasureAxisMinValue(vifAuthoring);
    if (_.isNull(limitMin)) {
      limitMin = '';
    }

    const isAuto = (this.state.measureAxisScaleControl == 'automatic') &&
      !limitMin && 
      !limitMax;

    const boundariesPart = (
      <div className="double-column-input-group">
        <div>
          <label className="block-label" htmlFor="measure-axis-scale-custom-min">
            {I18n.t('shared.visualizations.panes.axis_and_scale.fields.scale.minimum')}
          </label>
          <DebouncedInput type="number" value={limitMin} onChange={onMeasureAxisMinValueChange} className="text-input" id="measure-axis-scale-custom-min" />
        </div>
        <div>
          <label className="block-label" htmlFor="measure-axis-scale-custom-max">
            {I18n.t('shared.visualizations.panes.axis_and_scale.fields.scale.maximum')}
          </label>
          <DebouncedInput type="number" value={limitMax} onChange={onMeasureAxisMaxValueChange} className="text-input" id="measure-axis-scale-custom-max" />
        </div>
      </div>
    );

    const isDisabled = isOneHundredPercentStacked(vifAuthoring);
    const containerAttributes = {
      className: `${isDisabled ? 'authoring-field radiobutton disabled' : 'authoring-field radiobutton'}`
    };

    return (
      <AccordionPane title={I18n.t('shared.visualizations.panes.axis_and_scale.subheaders.scale')}>
        {I18n.t('shared.visualizations.panes.axis_and_scale.fields.scale.title')}
        <div {...containerAttributes}>
          <div>
            <input type="radio"
                   name="measure-axis-scale"
                   id="measure-axis-scale-automatic"
                   value="automatic"
                   onChange={this.onMeasureAxisScaleControlChange}
                   checked={isAuto}
                   disabled={isDisabled} />
            <label htmlFor="measure-axis-scale-automatic">
              <span className="fake-radiobutton" />
              <div className="translation-within-label">{I18n.t('shared.visualizations.panes.axis_and_scale.fields.scale.automatic')}</div>
            </label>
          </div>
          <div>
            <input type="radio"
                   name="measure-axis-scale"
                   id="measure-axis-scale-custom"
                   value="custom"
                   onChange={this.onMeasureAxisScaleControlChange}
                   checked={!isAuto}
                   disabled={isDisabled} />
            <label htmlFor="measure-axis-scale-custom">
              <span className="fake-radiobutton" />
              <div className="translation-within-label">{I18n.t('shared.visualizations.panes.axis_and_scale.fields.scale.custom')}</div>
            </label>
          </div>
        </div>

        {!isAuto ? boundariesPart : null}
      </AccordionPane>
    );
  }

  renderReferenceLinesControls() {
    const { vifAuthoring } = this.props;
    const controls = getReferenceLines(vifAuthoring).map(this.renderReferenceLinesControlsAtIndex);
    const link = this.renderAddReferenceLineLink();
    
    return (
      <AccordionPane title={I18n.t('shared.visualizations.panes.reference_lines.subheaders.reference_lines')}>
        {controls}
        {link}
      </AccordionPane>
    );
  }

  renderReferenceLinesControlsAtIndex(referenceLine, referenceLineIndex) {
    const {
      onChangeReferenceLineColor,
      onChangeReferenceLineValue,
      onClickRemoveReferenceLine,
      vifAuthoring
    } = this.props;

    const containerAttributes = {
      className: 'reference-lines-reference-line-container',
      id: `reference-lines-reference-line-container-${referenceLineIndex}`,
      key: referenceLine.uId
    };

    const headerLabel = I18n.t('shared.visualizations.panes.reference_lines.fields.reference_line_placeholder').
      format(referenceLineIndex + 1);

    const valueInputAttributes = {
      className: 'text-input',
      id: `reference-lines-value-input-${referenceLineIndex}`,
      onChange: (event) => {
        const i = parseFloat(event.target.value);
        const value = isNaN(i) ? null : i;

        onChangeReferenceLineValue({ referenceLineIndex, value });
      },
      placeholder: I18n.t('shared.visualizations.panes.reference_lines.fields.add_value'),
      step: 1,
      type: 'number',
      value: _.isFinite(referenceLine.value) ? referenceLine.value.toString() : '',
    };

    if (isOneHundredPercentStacked(vifAuthoring)) {
      valueInputAttributes.max = 100;
      valueInputAttributes.min = -100;
    }

    const textInputButton = this.renderReferenceLinesLabelTextInputButton(referenceLine, referenceLineIndex);

    const colorPickerAttributes = {
      handleColorChange: (color) => onChangeReferenceLineColor({ referenceLineIndex, color }),
      palette: COLORS,
      value: referenceLine.color,
    };

    const removeLinkAttributes = {
      onClick: () => {
        const key = this.getExpandedStateKey(referenceLineIndex);
        this.setState({ [key]: false });
  
        onClickRemoveReferenceLine(referenceLineIndex);
      }
    };

    return (
      <div {...containerAttributes}>
        <label className="block-label">
          {headerLabel}
        </label>
        <div className="reference-lines-controls-container">
          <DebouncedInput {...valueInputAttributes} />
          {textInputButton}
          <ColorPicker {...colorPickerAttributes} />
          <a {...removeLinkAttributes}>
            <span className="socrata-icon-close" />
          </a>
        </div>
      </div>
    );
  }

  renderReferenceLinesLabelTextInputButton(referenceLine, referenceLineIndex) {
    const { onChangeReferenceLineLabel } = this.props;
    const attributes = {
      onChange: event => onChangeReferenceLineLabel({ referenceLineIndex, label: event.target.value }),
      placeholder: I18n.t('shared.visualizations.panes.reference_lines.fields.add_label'),
      textInputId: `reference-lines-label-input-${referenceLineIndex}`,
      textInputValue: referenceLine.label
    };

    return <TextInputButton {...attributes} />;
  }

  renderReferenceLinesLabelInput(referenceLine, referenceLineIndex) {
    const key = this.getExpandedStateKey(referenceLineIndex);
    const expanded = _.get(this.state, key, false);

    if (!expanded) {
      return null;
    }

    const { onChangeReferenceLineLabel } = this.props;
    const attributes = {
      className: 'text-input',
      onChange: event => onChangeReferenceLineLabel({ referenceLineIndex, label: event.target.value }),
      placeholder: I18n.t('shared.visualizations.panes.reference_lines.fields.add_label'),
      value: referenceLine.label
    };

    return <DebouncedInput {...attributes} />;
  }

  getExpandedStateKey(referenceLineIndex) {
    return `text-input-button-expanded-${referenceLineIndex}`;
  }

  renderAddReferenceLineLink() {
    const { onClickAddReferenceLine, vifAuthoring } = this.props;
    const lines = getReferenceLines(vifAuthoring);
    const linesWithoutValues = _.filter(lines, (line) => _.isUndefined(line.value));
    const isDisabled = (linesWithoutValues.length > 0);

    const linkAttributes = {
      className: isDisabled ? 'disabled' : null,
      id: 'reference-lines-add-reference-line-link',
      onClick: isDisabled ? null : onClickAddReferenceLine
    };

    return (
      <div className="reference-lines-add-reference-line-link-container">
        <a {...linkAttributes}>
          <span className="socrata-icon-add" />
          {I18n.translate('shared.visualizations.panes.reference_lines.fields.add_reference_line')}
        </a>
      </div>);
  }

  renderTimelinePrecisionOption(option) {
    return (
      <div className="dataset-column-dropdown-option">
        {option.title}
      </div>
    );
  }

  renderBarChartControls() {
    const chartSorting = this.renderChartSorting();
    const measureAxisScaleControl = this.renderMeasureAxisScaleControl();
    const referenceLinesControls = this.renderReferenceLinesControls();

    return (
      <Accordion>
        {measureAxisScaleControl}
        {chartSorting}
        {referenceLinesControls}
      </Accordion>
    );
  }

  renderColumnChartControls() {
    const chartSorting = this.renderChartSorting();
    const measureAxisScaleControl = this.renderMeasureAxisScaleControl();
    const referenceLinesControls = this.renderReferenceLinesControls();

    return (
      <Accordion>
        {measureAxisScaleControl}
        {chartSorting}
        {referenceLinesControls}
      </Accordion>
    );
  }

  renderHistogramControls() {
    const measureAxisScaleControl = this.renderMeasureAxisScaleControl();
    const referenceLinesControls = this.renderReferenceLinesControls();

    return (
      <Accordion>
        {measureAxisScaleControl}
        {referenceLinesControls}
      </Accordion>
    );
  }

  renderTimelineChartControls() {
    const measureAxisScaleControl = this.renderMeasureAxisScaleControl();
    const referenceLinesControls = this.renderReferenceLinesControls();
    
    return (
      <Accordion>
        {measureAxisScaleControl}
        {referenceLinesControls}
      </Accordion>
    );
  }

  renderPieChartControls() {
    const chartSorting = this.renderChartSorting();

    return (
      <Accordion>
        {chartSorting}
      </Accordion>
    );
  }

  renderEmptyPane() {
    return <EmptyPane />;
  }

  render() {
    const { vifAuthoring } = this.props;

    let configuration;

    if (isBarChart(vifAuthoring)) {
      configuration = this.renderBarChartControls();
    } else if (isColumnChart(vifAuthoring)) {
      configuration = this.renderColumnChartControls();
    } else if (isHistogram(vifAuthoring)) {
      configuration = this.renderHistogramControls();
    } else if (isTimelineChart(vifAuthoring)) {
      configuration = this.renderTimelineChartControls();
    } else if (isPieChart(vifAuthoring)) {
      configuration = this.renderPieChartControls();
    } else {
      configuration = this.renderEmptyPane();
    }

    return (
      <form>
        {configuration}
      </form>
    );
  }
}

AxisAndScalePane.propTypes = {
  chartSorting: PropTypes.arrayOf(PropTypes.object),
  timelinePrecision: PropTypes.arrayOf(PropTypes.object)
};

AxisAndScalePane.defaultProps = {
  chartSorting: _.cloneDeep(CHART_SORTING)
};

function mapStateToProps(state) {
  return _.pick(state, ['datasetMetadata', 'metadata', 'vifAuthoring']);
}

function mapDispatchToProps(dispatch) {

  return {
    onClickAddReferenceLine: () => {
      dispatch(appendReferenceLine());
    },

    onClickRemoveReferenceLine: (referenceLineIndex) => {
      dispatch(removeReferenceLine(referenceLineIndex));
    },

    onChangeReferenceLineColor: ({ referenceLineIndex, color }) => {
      dispatch(setReferenceLineColor({ referenceLineIndex, color }));
    },

    onChangeReferenceLineLabel: ({ referenceLineIndex, label }) => {
      dispatch(setReferenceLineLabel({ referenceLineIndex, label }));
    },

    onChangeReferenceLineValue: ({ referenceLineIndex, value }) => {
      dispatch(setReferenceLineValue({ referenceLineIndex, value }));
    },

    onSelectChartSorting: (chartSorting) => {
      dispatch(setOrderBy(chartSorting.orderBy));
    },

    onMeasureAxisMinValueChange: (event) => {
      dispatch(setMeasureAxisMinValue(event.target.value));
    },

    onMeasureAxisMaxValueChange: (event) => {
      dispatch(setMeasureAxisMaxValue(event.target.value));
    },

    onMeasureAxisControlAuto: () => {
      dispatch(setMeasureAxisMinValue());
      dispatch(setMeasureAxisMaxValue());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AxisAndScalePane);
