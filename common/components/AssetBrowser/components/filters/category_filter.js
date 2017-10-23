import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import SearchboxFilter from './searchbox_filter';
import I18n from 'common/i18n';

import * as filters from 'common/components/AssetBrowser/actions/filters';

export class CategoryFilter extends Component {
  render() {
    const { category, changeCategory, domainCategories } = this.props;

    return (
      <div className="filter-section category">
        <label className="filter-label">
          {I18n.t('shared.asset_browser.filters.category.label')}
        </label>
        <SearchboxFilter
          inputId="category-filter"
          options={_.map(domainCategories, (curCategory) => ({ title: curCategory, value: curCategory }))}
          onSelection={changeCategory}
          placeholder={I18n.t('shared.asset_browser.filters.category.placeholder')}
          value={category} />
      </div>
    );
  }
}

CategoryFilter.propTypes = {
  category: PropTypes.string,
  changeCategory: PropTypes.func.isRequired,
  domainCategories: PropTypes.array.isRequired
};

const mapStateToProps = (state) => ({
  category: state.filters.category,
  domainCategories: state.filters.domainCategories
});

const mapDispatchToProps = (dispatch) => ({
  changeCategory: (value) => dispatch(filters.changeCategory(value))
});

export default connect(mapStateToProps, mapDispatchToProps)(CategoryFilter);
