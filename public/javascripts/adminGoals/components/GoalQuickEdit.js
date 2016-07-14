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

const mobileBreakpoint = 420;

class GoalQuickEdit extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hidden: true,
      goal: Immutable.Map(this.props.goal || {}),
      visibility: 'public',
      noChangesMade: true,
      title: '',
      alert: {}
    };

    this.onWindowKeyUp = (event) => {
      var key = event.which || event.keyCode;

      // ESC
      if (key === 27) {
        this.props.closeQuickEdit();
      }
    };
  }

  componentWillReceiveProps(nextProps) {
    let newState = {
      hidden: nextProps.goal.isEmpty(),
      goal: nextProps.goal,
      visibility: nextProps.goal.get('is_public') ? 'public' : 'private',
      title: nextProps.goal.get('name'),
      alert: nextProps.alert.toJS(),
      noChangesMade: true
    };

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
    }
  }

  componentDidMount() {
    $(window).on('keyup', this.onWindowKeyUp);
  }

  componentWillUnmount() {
    $(window).off('keyup', this.onWindowKeyUp);
  }

  onVisibilityChange(selected) {
    this.setState({
      visibility: selected.value,
      noChangesMade: false
    });
  }

  save() {
    this.props.saveGoalQuickEdit(
      this.props.goal.get('id'),
      this.props.goal.get('version'),
      {
        is_public: this.state.visibility == 'public',
        name: this.state.title
      }
    );
  }

  goalTitleChanged(event) {
    this.setState({
      noChangesMade: false,
      title: event.target.value
    });
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

    let visibilityOptions = [
      {
        label: this.props.translations.getIn(['admin', 'goal_values', 'status_public']),
        value: 'public'
      },
      {
        label: this.props.translations.getIn(['admin', 'goal_values', 'status_private']),
        value: 'private'
      }
    ];

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
            <form>
              <h5>{ this.props.translations.getIn(['admin', 'quick_edit', 'goal_title']) }</h5>

              <div className="form-line">
                <label className="inline-label">
                  { this.props.translations.getIn(['admin', 'quick_edit', 'goal_title']) }
                </label>
                <input
                  ref="titleInput"
                  className="text-input"
                  value={ this.state.title }
                  onChange={ this.goalTitleChanged.bind(this) }/>
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
                  className="visibilitySelect"
                  options={ visibilityOptions }
                  value={ this.state.visibility }
                  onChange={ this.onVisibilityChange.bind(this) }
                  searchable={ false }
                  clearable={ false } />
              </div>

              <h5>{ this.props.translations.getIn(['admin', 'quick_edit', 'prevailing_measure']) }</h5>

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
    Immutable.Map({}) :
    state.getIn(['goalTableData', 'cachedGoals', state.getIn(['goalTableData', 'goalQuickEditOpenGoalId'])]),
  alert: state.getIn(['goalTableData', 'goalQuickEditAlert'])
});

const mapDispatchToProps = dispatch => ({
  closeQuickEdit: () => dispatch(closeGoalQuickEdit()),
  saveGoalQuickEdit: (goalId, version, values) => dispatch(saveGoalQuickEdit(goalId, version, values))
});

export default connect(mapStateToProps, mapDispatchToProps)(GoalQuickEdit);
