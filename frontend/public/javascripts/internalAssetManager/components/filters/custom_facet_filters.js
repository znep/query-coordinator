import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';

import SearchboxFilter from './searchbox_filter';
import connectLocalization from 'common/i18n/components/connectLocalization';

import * as filters from '../../actions/filters';

export class CustomFacetFilters extends React.Component {
  render() {
    const { activeCustomFacets, changeCustomFacet, I18n, domainCustomFacets } = this.props;

    const customFacetFilters = _.map(domainCustomFacets, (customFacet) => {
      const facetParam = customFacet.param;
      return (
        <div className="filter-section custom-facet" key={`custom-facet_${facetParam}`}>
          <label className="filter-label">{customFacet.title}</label>
          <SearchboxFilter
            inputId={`custom-filter-${facetParam}`}
            options={_.map(customFacet.options, (option) => ({ title: option.text, value: option.value }))}
            onSelection={(option) => changeCustomFacet(facetParam, option.value)}
            placeholder={I18n.t('internal_asset_manager.filters.custom_facet.placeholder')}
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
  I18n: PropTypes.object.isRequired,
  domainCustomFacets: PropTypes.array.isRequired
};

const mapStateToProps = (state) => ({
  activeCustomFacets: state.filters.customFacets,
  domainCustomFacets: state.filters.domainCustomFacets
});

const mapDispatchToProps = (dispatch) => ({
  changeCustomFacet: (facetParam, value) => dispatch(filters.changeCustomFacet(facetParam, value))
});

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(CustomFacetFilters));
