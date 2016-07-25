import 'whatwg-fetch';
import _ from 'lodash';
import $ from 'jquery';
import React from 'react';
import Immutable from 'immutable';
import classNames from 'classnames/bind';
import { connect } from 'react-redux';
import { closeGoalQuickEdit, saveGoalQuickEdit } from '../actions/goalQuickEditActions';
import Select from 'react-select';
import moment from 'moment';
import QuickEditAlert from './Alert';
import { fetchOptions } from '../constants';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const mobileBreakpoint = 420;

class GoalQuickEdit extends React.Component {
  constructor(props) {
    super(props);

    this.state = _.merge({
      hidden: true,
      goal: this.props.goal || new Immutable.Map({}),
      noChangesMade: true,
      alert: {}
    }, this.prepState(props));

    this.onWindowKeyUp = (event) => {
      var key = event.which || event.keyCode;

      // ESC
      if (key === 27) {
        this.props.closeQuickEdit();
      }
    };

    this.actionTypeOptions = [
      {
        label: this.props.translations.getIn(['admin', 'quick_edit', 'action_types', 'increase']),
        value: 'increase'
      },
      {
        label: this.props.translations.getIn(['admin', 'quick_edit', 'action_types', 'reduce']),
        value: 'reduce'
      },
      {
        label: this.props.translations.getIn(['admin', 'quick_edit', 'action_types', 'maintain']),
        value: 'maintain'
      },
      {
        label: this.props.translations.getIn(['admin', 'quick_edit', 'action_types', 'measure']),
        value: 'none'
      }
    ];

    this.overrideOptions = [
      {
        label: this.props.translations.getIn(['admin', 'quick_edit', 'override_types', 'none']),
        value: 'none'
      },
      {
        label: this.props.translations.getIn(['admin', 'quick_edit', 'override_types', 'bad']),
        value: 'bad'
      },
      {
        label: this.props.translations.getIn(['admin', 'quick_edit', 'override_types', 'within_tolerance']),
        value: 'within_tolerance'
      },
      {
        label: this.props.translations.getIn(['admin', 'quick_edit', 'override_types', 'good']),
        value: 'good'
      },
      {
        label: this.props.translations.getIn(['admin', 'quick_edit', 'override_types', 'no_judgement']),
        value: 'no_judgement'
      }
    ];

    this.visibilityOptions = [
      {
        label: this.props.translations.getIn(['admin', 'goal_values', 'status_public']),
        value: 'public'
      },
      {
        label: this.props.translations.getIn(['admin', 'goal_values', 'status_private']),
        value: 'private'
      }
    ];

    this.measureTargetTypeOptions = [
      {
        label: this.props.translations.getIn(['admin', 'quick_edit', 'measure_target_type_types', 'absolute']),
        value: 'absolute'
      },
      {
        label: this.props.translations.getIn(['admin', 'quick_edit', 'measure_target_type_types', 'relative']),
        value: 'relative'
      }
    ];

    this.measureMaintainTypeOptions = [
      {
        label: this.props.translations.getIn(['admin', 'quick_edit', 'measure_maintain_types', 'within']),
        value: 'within'
      },
      {
        label: this.props.translations.getIn(['admin', 'quick_edit', 'measure_maintain_types', 'above']),
        value: '>'
      },
      {
        label: this.props.translations.getIn(['admin', 'quick_edit', 'measure_maintain_types', 'below']),
        value: '<'
      }
    ];
  }

  componentWillReceiveProps(nextProps) {
    let newState = this.prepState(nextProps);

    this.setState(newState);

    if (!nextProps.goal.isEmpty()) {
      fetch(`/api/views/${nextProps.goal.get('datasetId')}.json`, _.clone(fetchOptions)).
        then(response => response.json()).
        then(metadata => {
          this.setState({
            datasetUpdatedAt: _.get(metadata, 'rowsUpdatedAt'),
            datasetOwner: _.get(metadata, 'owner')
          });
        });

      $(window).on('keyup.socrata', this.onWindowKeyUp);
    } else {
      $(window).off('keyup.socrata', this.onWindowKeyUp);
    }
  }

  prepState(props) {
    return {
      hidden: props.goal.isEmpty(),
      goal: props.goal,
      visibility: props.goal.get('is_public') ? 'public' : 'private',
      name: props.goal.get('name'),
      alert: props.alert ? props.alert.toJS() : {},
      noChangesMade: true,
      actionType: props.goal.getIn(['prevailing_measure', 'edit', 'action_type']) || 'increase',
      prevailingMeasureName: props.goal.getIn(['prevailing_measure', 'name']),
      prevailingMeasureProgressOverride: props.goal.getIn(['prevailing_measure', 'use_progress_override']) ?
        props.goal.getIn(['prevailing_measure', 'progress_override']) : 'none',
      unit: props.goal.getIn(['prevailing_measure', 'unit']),
      percentUnit: props.goal.getIn(['prevailing_measure', 'target_delta_is_percent']) ?
        '%' : props.goal.getIn(['prevailing_measure', 'unit']),
      start: moment(props.goal.getIn(['prevailing_measure', 'start'])),
      end: moment(props.goal.getIn(['prevailing_measure', 'end'])),
      measureTarget: props.goal.getIn(['prevailing_measure', 'target']),
      measureTargetType: props.goal.getIn(['prevailing_measure', 'target_type']),
      measureBaseline: props.goal.getIn(['prevailing_measure', 'baseline']),
      measureTargetDelta: props.goal.getIn(['prevailing_measure', 'target_delta']),
      measureMaintainType: props.goal.getIn(['prevailing_measure', 'edit', 'maintain_type']) || 'within'
    };
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
    let goal = this.state.goal.toJS();

    let containerClass = classNames('modal', 'modal-full', 'modal-overlay', {'modal-hidden': this.state.hidden});
    let windowWidth = document.body.offsetWidth;

    let containerStyle = {
      left: 0
    };

    if (windowWidth >= mobileBreakpoint) {
      containerStyle.margin = '';
      document.body.style.overflow = '';
    } else {
      containerStyle.margin = 0;
      document.body.style.overflow = 'hidden';
    }

    let goalPageUrl = `/stat/goals/${this.state.goal.get('base_dashboard')}/${this.state.goal.getIn(['category', 'id'])}/${this.state.goal.get('id')}/edit`;

    return <div ref="container" className={ containerClass } style={ containerStyle } >
      <div className="modal-container">
        <header className="modal-header">
          <h1 className="modal-header-title">
            { this.props.translations.getIn(['admin', 'quick_edit', 'quick_edit_measure']) }&nbsp;-&nbsp;
            { _.get(goal, 'name') }
          </h1>
          <button className="btn btn-transparent modal-header-dismiss" onClick={ this.props.closeQuickEdit }>
            <span className="icon-close-2"/>
          </button>
        </header>

        <section className="modal-content">
          <QuickEditAlert { ...this.state.alert }/>
          <div className="goal-quick-edit-form">
            <form onSubmit={ this.save.bind(this) }>
              <h5>{ this.props.translations.getIn(['admin', 'quick_edit', 'goal_name']) }</h5>

              <div className="form-line">
                <label className="inline-label">
                  { this.props.translations.getIn(['admin', 'quick_edit', 'goal_name']) }
                </label>
                <input
                  className="text-input"
                  value={ this.state.name }
                  onChange={ this.onGoalNameChange.bind(this) }/>
              </div>

              <div className="form-line">
                <label className="inline-label">
                  { this.props.translations.getIn(['admin', 'quick_edit', 'status']) }
                </label>
                { this.props.translations.getIn(['measure', 'progress', _.get(goal, 'prevailingMeasureProgress')]) }
              </div>

              <div className="form-line">
                <label className="inline-label">
                  { this.props.translations.getIn(['admin', 'quick_edit', 'visibility']) }
                </label>
                <Select
                  className="form-select-small"
                  options={ this.visibilityOptions }
                  value={ this.state.visibility }
                  onChange={ this.onVisibilityChange.bind(this) }
                  searchable={ false }
                  clearable={ false } />
              </div>

              <h5>{ this.props.translations.getIn(['admin', 'quick_edit', 'prevailing_measure']) }</h5>

              <div className="prevailing-measure-container">
                <div className="form-line measure-action">
                  <label className="inline-label">
                    { this.props.translations.getIn(['admin', 'quick_edit', 'action_type']) }
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
            </form>
          </div>
          <div className="goal-quick-edit-details">
            <h6>{ this.props.translations.getIn(['admin', 'quick_edit', 'goal_updated']) }</h6>
            <div>{ moment(_.get(goal, 'updated_at')).format('ll') }</div>

            <h6>{ this.props.translations.getIn(['admin', 'quick_edit', 'goal_owner']) }</h6>
            <div>{ _.get(goal, 'created_by.displayName') }</div>

            <h6>{ this.props.translations.getIn(['admin', 'quick_edit', 'dashboard']) }</h6>
            <div>
              <a href={ `/stat/goals/${goal.base_dashboard}` } target="_blank" className="externalLink">
                { _.get(goal, 'dashboardName') }
                <span className="icon-external" />
              </a>
            </div>

            <h6>{ this.props.translations.getIn(['admin', 'quick_edit', 'category']) }</h6>
            <div>{ _.get(goal, 'category.name') }</div>

            <h6>{ this.props.translations.getIn(['admin', 'quick_edit', 'dataset_updated']) }</h6>
            <div>{ moment.unix(this.state.datasetUpdatedAt).format('ll') }</div>

            <h6>{ this.props.translations.getIn(['admin', 'quick_edit', 'dataset_owner']) }</h6>
            <div>{ _.get(this.state, 'datasetOwner.displayName') }</div>
          </div>
        </section>

        <footer className="modal-footer">
          <div className="link-container">
            <a href={ goalPageUrl } target="_blank" className="externalLink">
              { this.props.translations.getIn(['admin', 'quick_edit', 'manage_on_goal_page']) }
              <span className="icon-external" />
            </a>
          </div>
          <div className="modal-footer-actions">
            <button className="btn btn-default" onClick={ this.props.closeQuickEdit }>
              { this.props.translations.getIn(['admin', 'quick_edit', 'cancel']) }
            </button>
            <button className="btn btn-primary" onClick={ this.save.bind(this) } disabled={ this.state.noChangesMade }>
              { this.props.translations.getIn(['admin', 'quick_edit', 'save']) }
            </button>
          </div>
        </footer>
      </div>
    </div>;
  }
}

const mapStateToProps = state => ({
  translations: state.getIn(['goalTableData', 'translations']),
  goal: _.isNull(state.getIn(['goalTableData', 'goalQuickEditOpenGoalId'])) ?
    new Immutable.Map({}) :
    state.getIn(['goalTableData', 'cachedGoals', state.getIn(['goalTableData', 'goalQuickEditOpenGoalId'])]),
  alert: state.getIn(['goalTableData', 'goalQuickEditAlert'])
});

const mapDispatchToProps = dispatch => ({
  closeQuickEdit: () => dispatch(closeGoalQuickEdit()),
  saveGoalQuickEdit: (goalId, version, values) => dispatch(saveGoalQuickEdit(goalId, version, values))
});

export default connect(mapStateToProps, mapDispatchToProps)(GoalQuickEdit);
