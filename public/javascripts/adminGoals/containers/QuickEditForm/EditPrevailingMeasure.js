import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import Select from 'react-select';
import DatePicker from 'react-datepicker';

class EditPrevailingMeasure extends React.Component {
  constructor(props) {
    super(props);

    const translations = props.translations;

    this.actionTypeOptions = [
      {
        label: translations.getIn(['admin', 'quick_edit', 'action_types', 'increase']),
        value: 'increase'
      },
      {
        label: translations.getIn(['admin', 'quick_edit', 'action_types', 'reduce']),
        value: 'reduce'
      },
      {
        label: translations.getIn(['admin', 'quick_edit', 'action_types', 'maintain']),
        value: 'maintain'
      },
      {
        label: translations.getIn(['admin', 'quick_edit', 'action_types', 'measure']),
        value: 'none'
      }
    ];

    this.overrideOptions = [
      {
        label: translations.getIn(['admin', 'quick_edit', 'override_types', 'none']),
        value: 'none'
      },
      {
        label: translations.getIn(['admin', 'quick_edit', 'override_types', 'bad']),
        value: 'bad'
      },
      {
        label: translations.getIn(['admin', 'quick_edit', 'override_types', 'within_tolerance']),
        value: 'within_tolerance'
      },
      {
        label: translations.getIn(['admin', 'quick_edit', 'override_types', 'good']),
        value: 'good'
      },
      {
        label: translations.getIn(['admin', 'quick_edit', 'override_types', 'no_judgement']),
        value: 'no_judgement'
      }
    ];

    this.measureTargetTypeOptions = [
      {
        label: translations.getIn(['admin', 'quick_edit', 'measure_target_type_types', 'absolute']),
        value: 'absolute'
      },
      {
        label: translations.getIn(['admin', 'quick_edit', 'measure_target_type_types', 'relative']),
        value: 'relative'
      }
    ];

    this.measureMaintainTypeOptions = [
      {
        label: translations.getIn(['admin', 'quick_edit', 'measure_maintain_types', 'within']),
        value: 'within'
      },
      {
        label: translations.getIn(['admin', 'quick_edit', 'measure_maintain_types', 'above']),
        value: '>'
      },
      {
        label: translations.getIn(['admin', 'quick_edit', 'measure_maintain_types', 'below']),
        value: '<'
      }
    ];
  }

  renderSubjectPart() {
    const { translations, formData, isGoalNotConfigured } = this.props;

    return (
      <div className="form-line measure-subject">
        <label className="inline-label">
          { translations.getIn(['admin', 'quick_edit', 'prevailing_measure_name']) }
        </label>
        <input
          name="prevailingMeasureName"
          className="text-input"
          onChange={ this.props.onInputChange }
          disabled={ isGoalNotConfigured }
          value={ formData.get('prevailingMeasureName') } />
      </div>
    );
  }

  renderUnitPart() {
    const { translations, formData, isGoalNotConfigured } = this.props;

    return (
      <div className="form-line measure-unit">
        <label className="inline-label">
          { translations.getIn(['admin', 'quick_edit', 'unit']) }
        </label>
        <input
          name="unit"
          className="text-input"
          onChange={ this.props.onInputChange }
          disabled={ isGoalNotConfigured }
          value={ formData.get('unit') } />
      </div>
    );
  }

  renderPercentUnitPart() {
    const { translations, formData, isGoalNotConfigured } = this.props;

    let options = [
      {label: formData.get('unit'), value: formData.get('unit')},
      {label: '%', value: '%'}
    ];

    return (
      <div className="form-line measure-percent-unit">
        <label className="inline-label">
          { translations.getIn(['admin', 'quick_edit', 'unit']) }
        </label>
        <Select
          className="form-select-wide"
          options={ options }
          value={ formData.get('percentUnit') }
          onChange={ _.wrap('percentUnit', this.props.onSelectChange) }
          searchable={ false }
          clearable={ false }
          disabled={ isGoalNotConfigured } />
      </div>
    );
  }

  renderDateRangePart() {
    const { translations, formData, isGoalNotConfigured } = this.props;

    return (
      <div className="form-line measure-date-range">
        <label className="inline-label">
          { translations.getIn(['admin', 'quick_edit', 'date_range']) }
        </label>
        <div className="datepicker-wrapper">
          <span className="icon-date"/>
          <DatePicker
            className="text-input datepicker-input"
            onChange={ _.wrap('startDate', this.props.onSelectChange) }
            selected={ formData.get('startDate') } disabled={ isGoalNotConfigured } />
        </div>
        <div className="datepicker-wrapper">
          <span className="icon-date"/>
          <DatePicker
            className="text-input datepicker-input"
            onChange={ _.wrap('endDate', this.props.onSelectChange) }
            selected={ formData.get('endDate') } disabled={ isGoalNotConfigured } />
        </div>
      </div>
    );
  }

  renderOverridePart() {
    const { translations, formData, isGoalNotConfigured } = this.props;

    return (
      <div className="form-line measure-override">
        <label className="inline-label">
          { translations.getIn(['admin', 'quick_edit', 'override']) }
        </label>
        <Select
          className="form-select-wide"
          options={ this.overrideOptions }
          value={ formData.get('prevailingMeasureProgressOverride') }
          onChange={ _.wrap('prevailingMeasureProgressOverride', this.props.onSelectChange) }
          searchable={ false }
          clearable={ false }
          disabled={ isGoalNotConfigured } />
      </div>
    );
  }

  renderMeasureTarget() {
    const { translations, formData, isGoalNotConfigured } = this.props;

    return (
      <div className="form-line measure-target">
        <label className="inline-label">
          { translations.getIn(['admin', 'quick_edit', 'measure_target']) }
        </label>
        <input
          name="measureTarget"
          className="text-input"
          onChange={ this.props.onInputChange }
          value={ formData.get('measureTarget') }
          disabled={ isGoalNotConfigured } />
      </div>
    );
  }

  renderMeasureTargetTypePart() {
    const { translations, formData, isGoalNotConfigured } = this.props;

    return <div className="form-line measure-target-type">
      <label className="inline-label">
        { translations.getIn(['admin', 'quick_edit', 'measure_target_type']) }
      </label>
      <Select
        className="form-select-small"
        options={ this.measureTargetTypeOptions }
        value={ formData.get('measureTargetType') }
        onChange={ _.wrap('measureTargetType', this.props.onSelectChange) }
        searchable={ false }
        clearable={ false }
        disabled={ isGoalNotConfigured } />
    </div>;
  }

  renderMeasureBaseline() {
    const { translations, formData, isGoalNotConfigured } = this.props;

    return (
      <div className="form-line measure-baseline">
        <label className="inline-label">
          { translations.getIn(['admin', 'quick_edit', 'measure_baseline']) }
        </label>
        <input
          name="measureBaseline"
          className="text-input"
          onChange={ this.props.onInputChange }
          value={ formData.get('measureBaseline') }
          disabled={ isGoalNotConfigured } />
      </div>
    );
  }

  renderMeasureTargetDelta() {
    const { translations, formData, isGoalNotConfigured } = this.props;

    return <div className="form-line measure-target-delta">
      <label className="inline-label">
        { translations.getIn(['admin', 'quick_edit', 'measure_delta']) }
      </label>
      <input
        name="measureTargetDelta"
        className="text-input"
        onChange={ this.props.onInputChange }
        value={ formData.get('measureTargetDelta') }
        disabled={ isGoalNotConfigured } />
    </div>;
  }

  renderMeasureMaintainType() {
    const { translations, formData, isGoalNotConfigured } = this.props;

    return (
      <div className="form-line measure-maintain-type">
        <label className="inline-label">
          { translations.getIn(['admin', 'quick_edit', 'range']) }
        </label>
        <Select
          className="form-select-small"
          options={ this.measureMaintainTypeOptions }
          value={ formData.get('measureMaintainType') }
          onChange={ _.wrap('measureMaintainType', this.props.onSelectChange) }
          searchable={ false }
          clearable={ false }
          disabled={ isGoalNotConfigured } />
      </div>
    );
  }

  renderOnIncreaseAndReduce() {
    return this.props.formData.get('measureTargetType') == 'absolute' ?
      <div>
        { this.renderSubjectPart() }
        { this.renderMeasureTargetTypePart() }
        { this.renderMeasureTarget() }
        { this.renderUnitPart() }
        { this.renderDateRangePart() }
      </div> :
      <div>
        { this.renderSubjectPart() }
        { this.renderMeasureTargetTypePart() }
        { this.renderMeasureBaseline() }
        { this.renderUnitPart() }
        { this.renderMeasureTargetDelta() }
        { this.renderPercentUnitPart() }
        { this.renderDateRangePart() }
      </div>;
  }

  renderOnMaintain() {
    switch (this.props.formData.get('measureMaintainType')) {
      case 'within':
        return <div>
          { this.renderSubjectPart() }
          { this.renderMeasureMaintainType() }
          { this.renderMeasureBaseline() }
          { this.renderUnitPart() }
          { this.renderMeasureTargetDelta() }
          { this.renderPercentUnitPart() }
          { this.renderDateRangePart() }
        </div>;
      case '<':
      case '>':
      default:
        return <div>
          { this.renderSubjectPart() }
          { this.renderMeasureMaintainType() }
          { this.renderMeasureBaseline() }
          { this.renderUnitPart() }
          { this.renderDateRangePart() }
        </div>;
    }
  }

  renderOnMeasure() {
    return <div>
      { this.renderSubjectPart() }
      { this.renderUnitPart() }
      { this.renderDateRangePart() }
    </div>;
  }

  render() {
    const { translations, formData, isGoalNotConfigured } = this.props;

    return (
      <div>
        <h5>{ translations.getIn(['admin', 'quick_edit', 'prevailing_measure']) }</h5>

        <div className="prevailing-measure-container">
          <div className="form-line measure-action">
            <label className="inline-label">
              { translations.getIn(['admin', 'quick_edit', 'action_type']) }
            </label>
            <Select
              className="form-select-small"
              options={ this.actionTypeOptions }
              value={ formData.get('actionType') }
              onChange={ _.wrap('actionType', this.props.onSelectChange) }
              searchable={ false }
              clearable={ false }
              disabled={ isGoalNotConfigured } />
          </div>

          {(() => {
            switch (formData.get('actionType')) {
              case 'none':
                return this.renderOnMeasure();
              case 'maintain':
                return this.renderOnMaintain();
              case 'increase':
              case 'reduce':
              default:
                return this.renderOnIncreaseAndReduce();
            }
          })()}

          { this.renderOverridePart() }
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  translations: state.get('translations'),
  formData: state.getIn(['quickEditForm', 'formData'])
});

export default connect(mapStateToProps, null)(EditPrevailingMeasure);
