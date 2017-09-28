import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { Dropdown } from 'common/components';
import connectLocalization from 'common/i18n/components/connectLocalization';

import * as filterOptions from '../../lib/catalog_filter_options';
import * as filters from '../../actions/filters';

export class AuthorityFilter extends React.Component {
  render() {
    const { authority, changeAuthority, I18n } = this.props;

    const labelText = I18n.t('internal_asset_manager.filters.authority.label');

    return (
      <div className="filter-section authority">
        <label className="filter-label">{labelText}</label>
        <Dropdown
          onSelection={(option) => changeAuthority(option.value)}
          options={filterOptions.authorityOptions}
          size="medium"
          value={authority || null} />
      </div>
    );
  }
}

AuthorityFilter.propTypes = {
  authority: PropTypes.string,
  changeAuthority: PropTypes.func.isRequired,
  I18n: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  authority: state.filters.authority
});

const mapDispatchToProps = (dispatch) => ({
  changeAuthority: (value) => dispatch(filters.changeAuthority(value))
});

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(AuthorityFilter));
