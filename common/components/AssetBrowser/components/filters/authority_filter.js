import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Dropdown from 'common/components/Dropdown';
import I18n from 'common/i18n';

import * as filterOptions from 'common/components/AssetBrowser/lib/catalog_filter_options';
import * as filters from 'common/components/AssetBrowser/actions/filters';

export class AuthorityFilter extends Component {
  render() {
    const { authority, changeAuthority } = this.props;

    const labelText = I18n.t('shared.asset_browser.filters.authority.label');

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
  changeAuthority: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  authority: state.filters.authority
});

const mapDispatchToProps = (dispatch) => ({
  changeAuthority: (value) => dispatch(filters.changeAuthority(value))
});

export default connect(mapStateToProps, mapDispatchToProps)(AuthorityFilter);
