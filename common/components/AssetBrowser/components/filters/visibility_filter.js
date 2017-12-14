import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Dropdown from 'common/components/Dropdown';
import I18n from 'common/i18n';

import * as filters from 'common/components/AssetBrowser/actions/filters';

export class VisibilityFilter extends Component {
  render() {
    const { visibility, changeVisibility } = this.props;
    const scope = 'shared.asset_browser.filters.visibility';

    const visibilityOptions = [
      { title: I18n.t('options.all', { scope }), value: null, defaultOption: true },
      { title: I18n.t('options.public', { scope }), value: 'open' },
      { title: I18n.t('options.private', { scope }), value: 'internal' }
    ];

    const labelText = I18n.t('label', { scope });

    return (
      <div className="filter-section visibility">
        <label className="filter-label">{labelText}</label>
        <Dropdown
          onSelection={(option) => changeVisibility(option.value)}
          options={visibilityOptions}
          size="medium"
          value={visibility || null} />
      </div>
    );
  }
}

VisibilityFilter.propTypes = {
  visibility: PropTypes.string,
  changeVisibility: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  visibility: state.filters.visibility
});

const mapDispatchToProps = (dispatch) => ({
  changeVisibility: (value) => dispatch(filters.changeVisibility(value))
});

export default connect(mapStateToProps, mapDispatchToProps)(VisibilityFilter);
