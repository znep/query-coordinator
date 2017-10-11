import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import SearchboxFilter from './searchbox_filter';
import I18n from 'common/i18n';

import * as filters from 'common/components/AssetBrowser/actions/filters';

export class CustomFacetFilters extends Component {
  render() {
    const { activeCustomFacets, changeCustomFacet, domainCustomFacets } = this.props;

    const customFacetFilters = _.map(domainCustomFacets, (customFacet) => {
      const facetParam = customFacet.param;
      return (
        <div className="filter-section custom-facet" key={`custom-facet_${facetParam}`}>
          <label className="filter-label">{customFacet.title}</label>
          <SearchboxFilter
            inputId={`custom-filter-${facetParam}`}
            options={_.map(customFacet.options, (option) => ({ title: option.text, value: option.value }))}
            onSelection={(option) => changeCustomFacet(facetParam, option.value)}
            placeholder={I18n.t('shared.asset_browser.filters.custom_facet.placeholder')}
            value={activeCustomFacets[facetParam]} />
        </div>
      );
    });

    return (
      <div className="custom-facets">
        {customFacetFilters}
      </div>
    );
  }
}

CustomFacetFilters.defaultProps = {
  activeCustomFacets: {}
};

CustomFacetFilters.propTypes = {
  activeCustomFacets: PropTypes.object,
  changeCustomFacet: PropTypes.func.isRequired,
  domainCustomFacets: PropTypes.array.isRequired
};

const mapStateToProps = (state) => ({
  activeCustomFacets: state.filters.customFacets,
  domainCustomFacets: state.filters.domainCustomFacets
});

const mapDispatchToProps = (dispatch) => ({
  changeCustomFacet: (facetParam, value) => dispatch(filters.changeCustomFacet(facetParam, value))
});

export default connect(mapStateToProps, mapDispatchToProps)(CustomFacetFilters);
