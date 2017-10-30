import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'lodash';

import SocrataIcon from 'common/components/SocrataIcon';
import I18n from 'common/i18n';

const scope = 'approvals.settings';

export class Settings extends Component {
  constructor(props) {
    super(props);

    this.approvalStateMapping = {
      'pending': 'sendToQueue',
      'approved': 'automaticallyApprove',
      'rejected': 'rejectAll'
    };

    this.reapprovalPolicyMapping = {
      'manual': true,
      'auto': false
    };

    this.state = {
      // TODO: Still need to source the values from props somewhere.
      approvers: _.chain(this.props.approvers).keyBy('id').mapValues((_) => false).value(),
      // Figure out how to get this from props:
      automaticApprovalConfiguration: {
        official: {
          approvalState: 'approved',
          reapprovalPolicy: 'auto'
        },
        community: {
          approvalState: 'pending',
          reapprovalPolicy: 'manual'
        }
      }
    };

    _.bindAll(this,
      'handleAutomaticApprovalConfigurationChange',
      'handleReapprovalPolicyChange'
    );
  }

  handleAutomaticApprovalConfigurationChange(event) {
    const scope = event.target.name.match(/approval-configuration-(\w+)/)[1];
    const value = _.invert(this.approvalStateMapping)[
      event.target.id.match(/approval-configuration-(\w+)-(\w+)/)[2]
    ];
    const newData = _.cloneDeep(this.state);

    newData.automaticApprovalConfiguration[scope].approvalState = value;
    this.setState(newData);
  }

  handleReapprovalPolicyChange(event) {
    const scope = event.target.id.match(/approval-configuration-(\w+)-reapproval/)[1];
    const value = _.invert(this.reapprovalPolicyMapping)[event.target.checked];
    const newData = _.cloneDeep(this.state);

    newData.automaticApprovalConfiguration[scope].reapprovalPolicy = value;
    this.setState(newData);
  }

  renderIntroduction() {
    return (
      <div className="introduction">
        <div className="section-title">
          {I18n.t('introduction.header', { scope })}
        </div>
        <p>{I18n.t('introduction.paragraph_1', { scope })}</p>
        <p>{I18n.t('introduction.paragraph_2', { scope })}</p>
      </div>
    );
  }

  renderApproverConfiguration() {
    const { approvers } = this.props;

    const users = (approvers || []).map((user) => {
      const longForm = `user-setting-for-${user.id}`;
      return (
        <div key={user.uid} className="user-setting">
          <label className="name">{user.displayName}</label>
          <div>
            <input
              type="checkbox"
              checked={this.state.approvers[user.id]}
              id={longForm}
              name={longForm} />
          </div>
          <label className="helper" htmlFor={longForm}>
            {I18n.t('approver_configuration.user_setting.email_notification', { scope })}
          </label>
        </div>
      );
    });

    return (
      <div className="approver-configuration">
        <div className="section-title">
          {I18n.t('approver_configuration.header', { scope })}
        </div>
        <p
          dangerouslySetInnerHTML={{ __html: I18n.t('approver_configuration.paragraph_1',
            { link: '/admin/users', scope }) }} />
        {users}
      </div>
    );
  }

  renderAutomaticApprovalConfiguration(type) {
    const title = I18n.t(`automatic_approval.header.${type}`, { scope });

    const idFor = (value) => `approval-configuration-${type}-${value}`;

    const radioButton = (value) => {
      const checked = this.approvalStateMapping[
        this.state.automaticApprovalConfiguration[type].approvalState
      ] === value;

      return (
        <div>
          <input
            type="radio"
            id={idFor(value)}
            name={`approval-configuration-${type}`}
            onChange={this.handleAutomaticApprovalConfigurationChange}
            checked={checked} />
        </div>
      );
    };

    const reapprovalCheckbox = () => {
      const checked = this.reapprovalPolicyMapping[
        this.state.automaticApprovalConfiguration[type].reapprovalPolicy
      ];

      return (
        <div>
          <input
            type="checkbox"
            id={idFor('reapproval')}
            name={`approval-configuration-${type}-reapprove`}
            onChange={this.handleReapprovalPolicyChange}
            checked={checked} />
        </div>
      );
    };

    const iconName = (() => {
      switch (type) {
        case 'official': return 'official2';
        case 'community': return 'community';
        default: throw Error.new(`Unknown resource type: '${type}'`);
      }
    })();

    return (
      <div className={`approval-configuration approval-configuration-${type}`}>
        <div className="configuration-title"><SocrataIcon name={iconName} />{title}</div>
        <ul>
          <li>
            {radioButton('sendToQueue')}
            <div>
              <label className="radioLabel" htmlFor={idFor('sendToQueue')}>
                {I18n.t('automatic_approval.send_to_my_queue', { scope })}
              </label>
              <div className="checkboxWrapper">
                {reapprovalCheckbox()}
                <label htmlFor={idFor('reapproval')}>
                  {I18n.t('automatic_approval.require_on_republish', { scope })}
                </label>
              </div>
            </div>
          </li>
          <li>
            {radioButton('automaticallyApprove')}
            <label className="radioLabel" htmlFor={idFor('automaticallyApprove')}>
              {I18n.t('automatic_approval.automatically_approve', { scope })}
              <div>{I18n.t('automatic_approval.explanation', { scope })}</div>
            </label>
          </li>
          <li>
            {radioButton('rejectAll')}
            <label className="radioLabel" htmlFor={idFor('rejectAll')}>
              {I18n.t('automatic_approval.reject_all', { scope })}
              <div>{I18n.t('automatic_approval.explanation', { scope })}</div>
            </label>
          </li>
        </ul>
      </div>
    );
  }

  render() {
    return (
      <div className="settings">
        <div className="settingsContainer">
          {this.renderIntroduction()}
          <div className="automatically-approve">
            {this.renderAutomaticApprovalConfiguration('official')}
            {this.renderAutomaticApprovalConfiguration('community')}
          </div>
          {this.renderApproverConfiguration()}
          <div className="actions">
            <button className="btn btn-sm">{I18n.t('cancel', { scope })}</button>
            <button className="btn btn-sm btn-primary btn-dark">{I18n.t('save', { scope })}</button>
          </div>
        </div>
      </div>
    );
  }
}

Settings.propTypes = {
  approvers: PropTypes.array
};

const mapStateToProps = (state) => ({
  approvers: state.settings.approvers
});

const mapDispatchToProps = (dispatch) => ({

});

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
