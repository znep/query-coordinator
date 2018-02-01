import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Dropdown from 'common/components/Dropdown';
import I18n from 'common/i18n';
import SocrataIcon from 'common/components/SocrataIcon';

import * as filters from 'common/components/AssetBrowser/actions/filters';
import { AUTHORITY_OFFICIAL, AUTHORITY_COMMUNITY } from 'common/components/AssetBrowser/lib/constants';

export class AuthorityFilter extends Component {
  render() {
    const { authority, changeAuthority } = this.props;
    const scope = 'shared.asset_browser.filters.authority';

    const communityIcon = <SocrataIcon name="community" />;
    const officialIcon = <SocrataIcon name="official2" />;

    const authorityOptions = [
      { title: I18n.t('options.all', { scope }), value: null, defaultOption: true },
      { title: I18n.t('options.official', { scope }), value: AUTHORITY_OFFICIAL, icon: officialIcon },
      { title: I18n.t('options.community', { scope }), value: AUTHORITY_COMMUNITY, icon: communityIcon }
    ];

    const labelText = I18n.t('label', { scope });

    return (
      <div className="filter-section authority">
        <label className="filter-label">{labelText}</label>
        <Dropdown
          onSelection={(option) => changeAuthority(option.value)}
          options={authorityOptions}
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
