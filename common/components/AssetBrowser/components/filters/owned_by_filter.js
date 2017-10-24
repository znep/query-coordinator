import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import SearchboxFilter from './searchbox_filter';
import I18n from 'common/i18n';

import * as filters from '../../actions/filters';

export class OwnedByFilter extends Component {
  render() {
    const { ownedBy, changeOwner, usersList } = this.props;

    return (
      <div className="filter-section owned-by">
        <label className="filter-label">
          {I18n.t('shared.asset_browser.filters.owned_by.label')}
        </label>
        <SearchboxFilter
          inputId="owned-by-filter"
          options={_.map(usersList, (user) =>
            ({ title: _.get(user, 'displayName'), value: _.get(user, 'id') }))}
          onSelection={changeOwner}
          placeholder={I18n.t('shared.asset_browser.filters.owned_by.placeholder')}
          value={_.get(ownedBy, 'displayName')} />
      </div>
    );
  }
}

OwnedByFilter.propTypes = {
  ownedBy: PropTypes.shape({
    displayName: PropTypes.string,
    id: PropTypes.string
  }),
  changeOwner: PropTypes.func.isRequired,
  usersList: PropTypes.array.isRequired
};

const mapStateToProps = (state) => ({
  ownedBy: state.filters.ownedBy,
  usersList: state.filters.usersList
});

const mapDispatchToProps = (dispatch) => ({
  changeOwner: (value) => dispatch(filters.changeOwner(value))
});

export default connect(mapStateToProps, mapDispatchToProps)(OwnedByFilter);