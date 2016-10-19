import _ from 'lodash';
import * as React from 'react';
import * as ReactRedux from 'react-redux';
import * as State from '../../state';
import * as Components from '../../../../components';
import goalStatusTranslation from '../../../../helpers/goalStatus';

import moment from 'moment';

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
        label: goalStatusTranslation(translations, ['measure', 'progress', 'none']),
        value: 'none'
      },
      {
        label: goalStatusTranslation(translations, ['measure', 'progress', 'bad']),
        value: 'bad'
      },
      {
        label: goalStatusTranslation(translations, ['measure', 'progress', 'within_tolerance']),
        value: 'within_tolerance'
      },
      {
        label: goalStatusTranslation(translations, ['measure', 'progress', 'good']),
        value: 'good'
      },
      {
        label: goalStatusTranslation(translations, ['measure', 'progress', 'no_judgement']),
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
    const {
      translations,
      formData,
      isGoalNotConfigured,
      onInputChange
    } = this.props;

    return (
      <div className="form-line measure-subject">
        <label className="inline-label">
          { translations.getIn(['admin', 'quick_edit', 'prevailing_measure_name']) }
        </label>
        <input
          name="prevailingMeasureName"
          type="text"
          className="text-input"
          onChange={ onInputChange }
          disabled={ isGoalNotConfigured }
          value={ formData.get('prevailingMeasureName') || '' } />
      </div>
    );
  }

  renderUnitPart() {
    const {
      translations,
      formData,
      isGoalNotConfigured,
      onInputChange
    } = this.props;

    return (
      <div className="form-line measure-unit">
        <label className="inline-label">
          { translations.getIn(['admin', 'quick_edit', 'unit']) }
        </label>
        <input
          name="unit"
          className="text-input"
          onChange={ onInputChange }
          disabled={ isGoalNotConfigured }
          value={ formData.get('unit') || '' }/>
      </div>
    );
  }

  renderPercentUnitPart() {
    const {
      translations,
      formData,
      isGoalNotConfigured,
      onSelectChange
    } = this.props;

    const options = [
      { label: formData.get('unit'), value: formData.get('unit') },
      { label: '%', value: '%' }
    ];

    return (
      <div className="form-line measure-percent-unit">
        <label className="inline-label">
          { translations.getIn(['admin', 'quick_edit', 'unit']) }
        </label>
        <Components.Select
          className="form-select-wide"
          options={ options }
          value={ formData.get('percentUnit') || null }
          onChange={ _.wrap('percentUnit', onSelectChange) }
          searchable={ false }
          clearable={ false }
          disabled={ isGoalNotConfigured }/>
      </div>
    );
  }

  renderDateRangePart() {
    const {
      translations,
      formData,
      isGoalNotConfigured,
      onSelectChange
    } = this.props;
    const startDate = formData.get('startDate') ? moment(formData.get('startDate')) : null;
    const endDate = formData.get('endDate') ? moment(formData.get('endDate')) : null;

    return (
      <div className="form-line measure-date-range">
        <label className="inline-label">
          { translations.getIn(['admin', 'quick_edit', 'date_range']) }
        </label>
        <div className="datepicker-wrapper">
          <span className="icon-date"/>
          <Components.Socrata.DatePicker
            className="text-input datepicker-input"
            onChange={ _.wrap('startDate', onSelectChange) }
            selected={ startDate } disabled={ isGoalNotConfigured }/>
        </div>
        <div className="datepicker-wrapper">
          <span className="icon-date"/>
          <Components.Socrata.DatePicker
            className="text-input datepicker-input"
            onChange={ _.wrap('endDate', onSelectChange) }
            selected={ endDate } disabled={ isGoalNotConfigured }/>
        </div>
      </div>
    );
  }

  renderOverridePart() {
    const {
      translations,
      formData,
      isGoalNotConfigured,
      onSelectChange
    } = this.props;

    return (
      <div className="form-line measure-override">
        <label className="inline-label">
          { translations.getIn(['admin', 'quick_edit', 'override']) }
        </label>
        <Components.Select
          className="form-select-wide"
          options={ this.overrideOptions }
          value={ formData.get('prevailingMeasureProgressOverride') }
          onChange={ _.wrap('prevailingMeasureProgressOverride', onSelectChange) }
          searchable={ false }
          clearable={ false }
          disabled={ isGoalNotConfigured }/>
      </div>
    );
  }

  renderMeasureTarget() {
    const {
      translations,
      formData,
      isGoalNotConfigured,
      onInputChange
    } = this.props;

    return (
      <div className="form-line measure-target">
        <label className="inline-label">
          { translations.getIn(['admin', 'quick_edit', 'measure_target']) }
        </label>
        <input
          name="measureTarget"
          className="text-input"
          onChange={ onInputChange }
          value={ formData.get('measureTarget') || '' }
          disabled={ isGoalNotConfigured }/>
      </div>
    );
  }

  renderMeasureTargetTypePart() {
    const {
      translations,
      formData,
      isGoalNotConfigured,
      onSelectChange
    } = this.props;

    return <div className="form-line measure-target-type">
      <label className="inline-label">
        { translations.getIn(['admin', 'quick_edit', 'measure_target_type']) }
      </label>
      <Components.Select
        className="form-select-small"
        options={ this.measureTargetTypeOptions }
        value={ formData.get('measureTargetType') }
        onChange={ _.wrap('measureTargetType', onSelectChange) }
        searchable={ false }
        clearable={ false }
        disabled={ isGoalNotConfigured }/>
    </div>;
  }

  renderMeasureBaseline() {
    const {
      translations,
      formData,
      isGoalNotConfigured,
      onInputChange
    } = this.props;

    return (
      <div className="form-line measure-baseline">
        <label className="inline-label">
          { translations.getIn(['admin', 'quick_edit', 'measure_baseline']) }
        </label>
        <input
          name="measureBaseline"
          className="text-input"
          onChange={ onInputChange }
          value={ formData.get('measureBaseline') || '' }
          disabled={ isGoalNotConfigured }/>
      </div>
    );
  }

  renderMeasureTargetDelta() {
    const {
      translations,
      formData,
      isGoalNotConfigured,
      onInputChange
    } = this.props;

    return <div className="form-line measure-target-delta">
      <label className="inline-label">
        { translations.getIn(['admin', 'quick_edit', 'measure_delta']) }
      </label>
      <input
        name="measureTargetDelta"
        className="text-input"
        onChange={ onInputChange }
        value={ formData.get('measureTargetDelta') || ''}
        disabled={ isGoalNotConfigured }/>
    </div>;
  }

  renderMeasureMaintainType() {
    const {
      translations,
      formData,
      isGoalNotConfigured,
      onSelectChange
    } = this.props;

    return (
      <div className="form-line measure-maintain-type">
        <label className="inline-label">
          { translations.getIn(['admin', 'quick_edit', 'range']) }
        </label>
        <Components.Select
          className="form-select-small"
          options={ this.measureMaintainTypeOptions }
          value={ formData.get('measureMaintainType') }
          onChange={ _.wrap('measureMaintainType', onSelectChange) }
          searchable={ false }
          clearable={ false }
          disabled={ isGoalNotConfigured }/>
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
    const {
      translations,
      formData,
      isGoalNotConfigured,
      onSelectChange
    } = this.props;

    return (
      <div>
        <h5>{ translations.getIn(['admin', 'quick_edit', 'prevailing_measure']) }</h5>

        <div className="prevailing-measure-container">
          <div className="form-line measure-action">
            <label className="inline-label">
              { translations.getIn(['admin', 'quick_edit', 'action_type']) }
            </label>
            <Components.Select
              className="form-select-small"
              options={ this.actionTypeOptions }
              value={ formData.get('actionType') }
              onChange={ _.wrap('actionType', onSelectChange) }
              searchable={ false }
              clearable={ false }
              disabled={ isGoalNotConfigured }/>
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
  formData: State.getQuickEdit(state).get('formData')
});

export default ReactRedux.connect(mapStateToProps, null)(EditPrevailingMeasure);
