import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';

import SearchboxFilter from './searchbox_filter';
import connectLocalization from 'common/i18n/components/connectLocalization';

import * as filters from '../../actions/filters';

export class CategoryFilter extends React.Component {
  render() {
    const { category, changeCategory, I18n, domainCategories } = this.props;

    return (
      <div className="filter-section category">
        <label className="filter-label">
          {I18n.t('internal_asset_manager.filters.category.label')}
        </label>
        <SearchboxFilter
          inputId="category-filter"
          options={_.map(domainCategories, (curCategory) => ({ title: curCategory, value: curCategory }))}
          onSelection={changeCategory}
          placeholder={I18n.t('internal_asset_manager.filters.category.placeholder')}
          value={category} />
      </div>
    );
  }
}

CategoryFilter.propTypes = {
  category: PropTypes.string,
  changeCategory: PropTypes.func.isRequired,
  I18n: PropTypes.object.isRequired,
  domainCategories: PropTypes.array.isRequired
};

const mapStateToProps = (state) => ({
  category: state.filters.category,
  domainCategories: state.filters.domainCategories
});

const mapDispatchToProps = (dispatch) => ({
  changeCategory: (value) => dispatch(filters.changeCategory(value))
});

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(CategoryFilter));
