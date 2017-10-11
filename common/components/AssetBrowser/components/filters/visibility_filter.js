import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Dropdown from 'common/components/Dropdown';
import I18n from 'common/i18n';

import * as filterOptions from 'common/components/AssetBrowser/lib/catalog_filter_options';
import * as filters from 'common/components/AssetBrowser/actions/filters';

export class VisibilityFilter extends Component {
  render() {
    const { visibility, changeVisibility } = this.props;

    const labelText = I18n.t('shared.asset_browser.filters.visibility.label');

    return (
      <div className="filter-section visibility">
        <label className="filter-label">{labelText}</label>
        <Dropdown
          onSelection={(option) => changeVisibility(option.value)}
          options={filterOptions.visibilityOptions}
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
