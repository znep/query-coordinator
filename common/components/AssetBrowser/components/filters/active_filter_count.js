import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

export class ActiveFilterCount extends Component {
  render() {
    const { allFilters } = this.props;

    const getFilterValue = _.partial(_.get, allFilters);

    const customFacetKeyPaths = _.keys(_.get(allFilters, 'customFacets')).
      map((customFacetKey) => `customFacets.${customFacetKey}`);

    // See similar list of key paths in ClearFilters component
    const filterKeyPaths = [
      'assetTypes',
      'authority',
      'category',
      'onlyAwaitingApproval',
      'onlyRecentlyViewed',
      'ownedBy.id',
      'tag',
      'visibility',
      'q'
    ].concat(customFacetKeyPaths);

    const activeFilters = _(filterKeyPaths).map((filter) => getFilterValue(filter)).compact().value();
    const activeFilterCount = activeFilters.length;

    return (activeFilterCount === 0) ? null :
      <span className="active-filter-count">({activeFilterCount})</span>;
  }
}

ActiveFilterCount.propTypes = {
  allFilters: PropTypes.object
};

const mapStateToProps = (state) => ({
  allFilters: state.filters
});

export default connect(mapStateToProps)(ActiveFilterCount);
