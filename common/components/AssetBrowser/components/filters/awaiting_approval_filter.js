import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import I18n from 'common/i18n';
import { SocrataIcon } from 'common/components';

import * as filters from 'common/components/AssetBrowser/actions/filters';

export class AwaitingApprovalFilter extends Component {
  render() {
    const { onlyAwaitingApproval, toggleAwaitingApproval } = this.props;

    const inputId = 'filter-awaiting-approval';

    return (
      <div className="filter-section awaiting-approval">
        <div className="checkbox checkbox-filter">
          <input id={inputId} type="checkbox" onChange={toggleAwaitingApproval} checked={onlyAwaitingApproval} />
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
  onlyAwaitingApproval: PropTypes.bool,
  toggleAwaitingApproval: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  onlyAwaitingApproval: state.filters.onlyAwaitingApproval
});

const mapDispatchToProps = (dispatch) => ({
  toggleAwaitingApproval: (value) => dispatch(filters.toggleAwaitingApproval(value))
});

export default connect(mapStateToProps, mapDispatchToProps)(AwaitingApprovalFilter);
