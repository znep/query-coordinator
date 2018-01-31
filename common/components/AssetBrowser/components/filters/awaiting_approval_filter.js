import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import I18n from 'common/i18n';
import SocrataIcon from 'common/components/SocrataIcon';

import * as constants from 'common/components/AssetBrowser/lib/constants';
import * as filters from 'common/components/AssetBrowser/actions/filters';

export class AwaitingApprovalFilter extends Component {
  render() {
    const { awaitingApproval, toggleAwaitingApproval } = this.props;

    const inputId = 'filter-awaiting-approval';

    return (
      <div className="filter-section awaiting-approval">
        <div className="checkbox checkbox-filter">
          <input id={inputId} type="checkbox" onChange={toggleAwaitingApproval} checked={awaitingApproval} />
          <label htmlFor={inputId}>
            <span className="fake-checkbox">
              <SocrataIcon name="checkmark3" />
            </span>
            {I18n.t('shared.asset_browser.filters.awaiting_approval')}
          </label>
        </div>
      </div>
    );
  }
}

AwaitingApprovalFilter.propTypes = {
  awaitingApproval: PropTypes.bool,
  toggleAwaitingApproval: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  awaitingApproval: state.filters.approvalStatus === constants.APPROVAL_STATUS_PENDING
});

const mapDispatchToProps = (dispatch) => ({
  toggleAwaitingApproval: (value) => dispatch(filters.toggleAwaitingApproval(value))
});

export default connect(mapStateToProps, mapDispatchToProps)(AwaitingApprovalFilter);
