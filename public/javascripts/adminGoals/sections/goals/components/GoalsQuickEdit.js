import 'whatwg-fetch';
import _ from 'lodash';
import $ from 'jquery';
import React from 'react';
import { connect } from 'react-redux';
import { closeGoalQuickEdit, saveGoalQuickEdit } from '../actions/quickEdit';
import Select from 'react-select';
import moment from 'moment';
import SocrataAlert from '../../../components/SocrataAlert';
import SocrataButton from '../../../components/SocrataButton';
import * as SocrataModal from '../../../components/SocrataModal';
import DatePicker from 'react-datepicker';
import * as Selectors from '../selectors';
import 'react-datepicker/dist/react-datepicker.css';

class GoalQuickEdit extends React.Component {
  constructor(props) {
    super(props);

    const { goal, translations } = this.props;

    this.state = {
      goal: goal,
      noChangesMade: true,
      visibility: goal.get('is_public') ? 'public' : 'private',
      name: goal.get('name'),
      actionType: goal.getIn(['prevailing_measure', 'edit', 'action_type']) || 'increase',
      prevailingMeasureName: goal.getIn(['prevailing_measure', 'name']),
      prevailingMeasureProgressOverride: goal.getIn(['prevailing_measure', 'use_progress_override']) ?
        goal.getIn(['prevailing_measure', 'progress_override']) : 'none',
      unit: goal.getIn(['prevailing_measure', 'unit']),
      percentUnit: goal.getIn(['prevailing_measure', 'target_delta_is_percent']) ?
        '%' : goal.getIn(['prevailing_measure', 'unit']),
      start: moment(goal.getIn(['prevailing_measure', 'start'])),
      end: moment(goal.getIn(['prevailing_measure', 'end'])),
      measureTarget: goal.getIn(['prevailing_measure', 'target']),
      measureTargetType: goal.getIn(['prevailing_measure', 'target_type']),
      measureBaseline: goal.getIn(['prevailing_measure', 'baseline']),
      measureTargetDelta: goal.getIn(['prevailing_measure', 'target_delta']),
      measureMaintainType: goal.getIn(['prevailing_measure', 'edit', 'maintain_type']) || 'within'
    };

    this.onWindowKeyUp = (event) => {
      var key = event.which || event.keyCode;

      // ESC
      if (key === 27) {
        this.props.closeQuickEdit();
      }
    };

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

    this.visibilityOptions = [
      {
        label: translations.getIn(['admin', 'goal_values', 'status_public']),
        value: 'public'
      },
      {
        label: translations.getIn(['admin', 'goal_values', 'status_private']),
        value: 'private'
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

  componentWillReceiveProps(nextProps) {
    const goal = nextProps.goal;

    this.setState({
      datasetUpdatedAt: goal.getIn(['coreView', 'rowsUpdatedAt'], false),
      datasetOwner: goal.getIn(['coreView', 'owner', 'displayName'], false)
    });
  }

  componentDidMount() {
    $(window).on('keyup.quick_edit_form.socrata', this.onWindowKeyUp);
    $('body').css('overflow', 'hidden');
  }

  componentWillUnmount() {
    $(window).off('keyup.quick_edit_form.socrata', this.onWindowKeyUp);
    $('body').css('overflow', 'initial');
  }

  onVisibilityChange(selected) {
    this.setState({
      visibility: selected.value,
      noChangesMade: false
    });
  }

  onStartDateChange(selected) {
    this.setState({
      start: selected,
      noChangesMade: false
    });
  }

  onEndDateChange(selected) {
    this.setState({
      end: selected,
      noChangesMade: false
    });
  }

  onOverrideChange(selected) {
    this.setState({
      prevailingMeasureProgressOverride: selected.value,
      noChangesMade: false
    });
  }

  onActionTypeChange(selected) {
    this.setState({
      actionType: selected.value,
      noChangesMade: false
    });
  }

  onPrevailingMeasureNameChange(event) {
    this.setState({
      prevailingMeasureName: event.target.value,
      noChangesMade: false
    });
  }

  onUnitChange(event) {
    this.setState({
      unit: event.target.value,
      noChangesMade: false
    });
  }

  onPercentUnitChange(selected) {
    this.setState({
      percentUnit: selected.value,
      noChangesMade: false
    });
  }

  onMeasureTargetChange(event) {
    this.setState({
      measureTarget: event.target.value,
      noChangesMade: false
    });
  }

  onMeasureTypeChange(selected) {
    this.setState({
      measureTargetType: selected.value,
      noChangesMade: false
    });
  }

  onMeasureBaselineChange(event) {
    this.setState({
      measureBaseline: event.target.value,
      noChangesMade: false
    });
  }

  onMeasureTargetDeltaChange(event) {
    this.setState({
      measureTargetDelta: event.target.value,
      noChangesMade: false
    });
  }

  onMeasureMaintainTypeChange(selected) {
    this.setState({
      measureMaintainType: selected.value,
      noChangesMade: false
    });
  }

  save(event) {
    event.preventDefault();

    this.props.saveGoalQuickEdit(
      this.props.goal.get('id'),
      this.props.goal.get('version'),
      {
        'is_public': this.state.visibility == 'public',
        'name': this.state.name,
        'action': this.state.actionType,
        'subject': this.state.prevailingMeasureName,
        'override': this.state.prevailingMeasureProgressOverride == 'none' ?
          '' : this.state.prevailingMeasureProgressOverride,
        'unit': this.state.unit,
        'delta_is_percent': this.state.percentUnit == '%',
        'start': this.state.start.format('YYYY-MM-DDT00:00:00.000'),
        'end': this.state.end.format('YYYY-MM-DDT00:00:00.000'),
        'target': this.state.measureTarget,
        'target_type': this.state.measureTargetType,
        'baseline': this.state.measureBaseline,
        'delta': this.state.measureTargetDelta,
        'maintain_type': this.state.measureMaintainType
      }
    );
  }

  onGoalNameChange(event) {
    this.setState({
      noChangesMade: false,
      name: event.target.value
    });
  }

  renderSubjectPart() {
    return <div className="form-line measure-subject">
      <label className="inline-label">
        { this.props.translations.getIn(['admin', 'quick_edit', 'prevailing_measure_name']) }
      </label>
      <input
        className="text-input"
        onChange={ this.onPrevailingMeasureNameChange.bind(this) }
        value={ this.state.prevailingMeasureName } />
    </div>;
  }

  renderUnitPart() {
    return <div className="form-line measure-unit">
      <label className="inline-label">
        { this.props.translations.getIn(['admin', 'quick_edit', 'unit']) }
      </label>
      <input
        className="text-input"
        onChange={ this.onUnitChange.bind(this) }
        value={ this.state.unit } />
    </div>;
  }

  renderPercentUnitPart() {
    let options = [
      {label: this.state.unit, value: this.state.unit},
      {label: '%', value: '%'}
    ];

    return <div className="form-line measure-percent-unit">
      <label className="inline-label">
        { this.props.translations.getIn(['admin', 'quick_edit', 'unit']) }
      </label>
      <Select
        className="form-select-wide"
        options={ options }
        value={ this.state.percentUnit }
        onChange={ this.onPercentUnitChange.bind(this) }
        searchable={ false }
        clearable={ false } />
    </div>;
  }

  renderDateRangePart() {
    return <div className="form-line measure-date-range">
      <label className="inline-label">
        { this.props.translations.getIn(['admin', 'quick_edit', 'date_range']) }
      </label>
      <div className="datepicker-wrapper">
        <span className="icon-date"/>
        <DatePicker
          className="text-input datepicker-input"
          onChange={ this.onStartDateChange.bind(this) }
          selected={ this.state.start } />
      </div>
      <div className="datepicker-wrapper">
        <span className="icon-date"/>
        <DatePicker
          className="text-input datepicker-input"
          onChange={ this.onEndDateChange.bind(this) }
          selected={ this.state.end } />
      </div>
    </div>;
  }

  renderOverridePart() {
    return <div className="form-line measure-override">
      <label className="inline-label">
        { this.props.translations.getIn(['admin', 'quick_edit', 'override']) }
      </label>
      <Select
        className="form-select-wide"
        options={ this.overrideOptions }
        value={ this.state.prevailingMeasureProgressOverride }
        onChange={ this.onOverrideChange.bind(this) }
        searchable={ false }
        clearable={ false } />
    </div>;
  }

  renderMeasureTarget() {
    return <div className="form-line measure-target">
      <label className="inline-label">
        { this.props.translations.getIn(['admin', 'quick_edit', 'measure_target']) }
      </label>
      <input
        className="text-input"
        onChange={ this.onMeasureTargetChange.bind(this) }
        value={ this.state.measureTarget } />
    </div>;
  }

  renderMeasureTargetTypePart() {
    return <div className="form-line measure-target-type">
      <label className="inline-label">
        { this.props.translations.getIn(['admin', 'quick_edit', 'measure_target_type']) }
      </label>
      <Select
        className="form-select-small"
        options={ this.measureTargetTypeOptions }
        value={ this.state.measureTargetType }
        onChange={ this.onMeasureTypeChange.bind(this) }
        searchable={ false }
        clearable={ false } />
    </div>;
  }

  renderMeasureBaseline() {
    return <div className="form-line measure-baseline">
      <label className="inline-label">
        { this.props.translations.getIn(['admin', 'quick_edit', 'measure_baseline']) }
      </label>
      <input
        className="text-input"
        onChange={ this.onMeasureBaselineChange.bind(this) }
        value={ this.state.measureBaseline } />
    </div>;
  }

  renderMeasureTargetDelta() {
    return <div className="form-line measure-target-delta">
      <label className="inline-label">
        { this.props.translations.getIn(['admin', 'quick_edit', 'measure_delta']) }
      </label>
      <input
        className="text-input"
        onChange={ this.onMeasureTargetDeltaChange.bind(this) }
        value={ this.state.measureTargetDelta } />
    </div>;
  }

  renderMeasureMaintainType() {
    return <div className="form-line measure-maintain-type">
      <label className="inline-label">
        { this.props.translations.getIn(['admin', 'quick_edit', 'range']) }
      </label>
      <Select
        className="form-select-small"
        options={ this.measureMaintainTypeOptions }
        value={ this.state.measureMaintainType }
        onChange={ this.onMeasureMaintainTypeChange.bind(this) }
        searchable={ false }
        clearable={ false } />
    </div>;
  }

  renderOnIncreaseAndReduce() {
    return this.state.measureTargetType == 'absolute' ?
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
    switch (this.state.measureMaintainType) {
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
    const goal = this.state.goal.toJS();
    const translations = this.props.translations;
    const goalPageUrl = `/stat/goals/${_.get(goal, 'base_dashboard')}/${_.get(goal, 'category.id')}/${_.get(goal, 'id')}/edit`;
    const goalTitle = `${ translations.getIn(['admin', 'quick_edit', 'quick_edit_measure']) } - ${ _.get(goal, 'name') }`;
    const failureAlert = this.props.showFailureMessage ?
      <SocrataAlert type="error" message={ translations.getIn(['admin', 'quick_edit', 'default_alert_message']) }/> : null;

    return (
      <SocrataModal.Modal fullScreen>
        <form onSubmit={ this.save.bind(this) }>
          <SocrataModal.Header title={ goalTitle } onClose={ this.props.closeQuickEdit }/>
          <SocrataModal.Content>
            { failureAlert }

            <div className="goal-quick-edit-form">
              <h5>{ translations.getIn(['admin', 'quick_edit', 'goal_name']) }</h5>

              <div className="form-line">
                <label className="inline-label">
                  { translations.getIn(['admin', 'quick_edit', 'goal_name']) }
                </label>
                <input
                  className="text-input"
                  value={ this.state.name }
                  onChange={ this.onGoalNameChange.bind(this) }/>
              </div>

              <div className="form-line">
                <label className="inline-label">
                  { translations.getIn(['admin', 'quick_edit', 'status']) }
                </label>
                { translations.getIn(['measure', 'progress', _.get(goal, 'prevailingMeasureProgress')]) }
              </div>

              <div className="form-line">
                <label className="inline-label">
                  { translations.getIn(['admin', 'quick_edit', 'visibility']) }
                </label>
                <Select
                  className="form-select-small"
                  options={ this.visibilityOptions }
                  value={ this.state.visibility }
                  onChange={ this.onVisibilityChange.bind(this) }
                  searchable={ false }
                  clearable={ false } />
              </div>

              <h5>{ translations.getIn(['admin', 'quick_edit', 'prevailing_measure']) }</h5>

              <div className="prevailing-measure-container">
                <div className="form-line measure-action">
                  <label className="inline-label">
                    { translations.getIn(['admin', 'quick_edit', 'action_type']) }
                  </label>
                  <Select
                    className="form-select-small"
                    options={ this.actionTypeOptions }
                    value={ this.state.actionType }
                    onChange={ this.onActionTypeChange.bind(this) }
                    searchable={ false }
                    clearable={ false } />
                </div>

                {(() => {
                  switch (this.state.actionType) {
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
            <div className="goal-quick-edit-details">
              <h6>{ translations.getIn(['admin', 'quick_edit', 'goal_updated']) }</h6>
              <div>{ moment(_.get(goal, 'updated_at')).format('ll') }</div>

              <h6>{ translations.getIn(['admin', 'quick_edit', 'goal_owner']) }</h6>
              <div>{ _.get(goal, 'created_by.displayName') }</div>

              <h6>{ translations.getIn(['admin', 'quick_edit', 'dashboard']) }</h6>
              <div>
                <a href={ `/stat/goals/${goal.base_dashboard}` } target="_blank" className="externalLink">
                  { _.get(goal, 'dashboardName') }
                  <span className="icon-external" />
                </a>
              </div>

              <h6>{ translations.getIn(['admin', 'quick_edit', 'category']) }</h6>
              <div>{ _.get(goal, 'category.name') }</div>

              <h6>{ translations.getIn(['admin', 'quick_edit', 'dataset_updated']) }</h6>
              <div>{ this.state.datasetUpdatedAt ? moment.unix(this.state.datasetUpdatedAt).format('ll') : '—' }</div>

              <h6>{ translations.getIn(['admin', 'quick_edit', 'dataset_owner']) }</h6>
              <div>{ _.get(this.state, 'datasetOwner.displayName') ? _.get(this.state, 'datasetOwner.displayName') : '—' }</div>
            </div>
          </SocrataModal.Content>
          <SocrataModal.Footer>
            <div className="link-container">
              <a href={ goalPageUrl } target="_blank" className="externalLink">
                { translations.getIn(['admin', 'quick_edit', 'manage_on_goal_page']) }
                <span className="icon-external" />
              </a>
            </div>
            <SocrataButton onClick={ this.props.closeQuickEdit }>
              { translations.getIn(['admin', 'quick_edit', 'cancel']) }
            </SocrataButton>
            <SocrataButton type="submit" primary onClick={ this.save.bind(this) } disabled={ this.state.noChangesMade }>
              { translations.getIn(['admin', 'quick_edit', 'save']) }
            </SocrataButton>
          </SocrataModal.Footer>
        </form>
      </SocrataModal.Modal>
    );
  }
}

const mapStateToProps = (state, props) => ({
  translations: state.get('translations'),
  goal: Selectors.getQuickEditGoal(state),
  message: state.getIn(['quickEditForm', 'showFailureMessage'])
});

const mapDispatchToProps = dispatch => ({
  closeQuickEdit: () => dispatch(closeGoalQuickEdit()),
  saveGoalQuickEdit: (goalId, version, values) => dispatch(saveGoalQuickEdit(goalId, version, values))
});

export default connect(mapStateToProps, mapDispatchToProps)(GoalQuickEdit);
