import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'lodash';

import SearchboxFilter from './searchbox_filter';
import connectLocalization from 'common/i18n/components/connectLocalization';

import * as filters from '../../actions/filters';

export class OwnedByFilter extends React.Component {
  render() {
    const { ownedBy, changeOwner, I18n, usersList } = this.props;

    return (
      <div className="filter-section owned-by">
        <label className="filter-label">
          {I18n.t('internal_asset_manager.filters.owned_by.label')}
        </label>
        <SearchboxFilter
          inputId="owned-by-filter"
          options={_.map(usersList, (user) =>
            ({ title: _.get(user, 'displayName'), value: _.get(user, 'id') }))}
          onSelection={changeOwner}
          placeholder={I18n.t('internal_asset_manager.filters.owned_by.placeholder')}
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
  I18n: PropTypes.object.isRequired,
  usersList: PropTypes.array.isRequired
};

const mapStateToProps = (state) => ({
  ownedBy: state.filters.ownedBy,
  usersList: state.filters.usersList
});

const mapDispatchToProps = (dispatch) => ({
  changeOwner: (value) => dispatch(filters.changeOwner(value))
});

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(OwnedByFilter));
