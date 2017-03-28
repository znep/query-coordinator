import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import { emitMixpanelEvent } from '../actions/mixpanel';
import * as search from '../actions/search';
import Searchbox from '../../common/components/searchbox/Searchbox';

export class Search extends Component {
  render() {
    var { term, clearSearch, performSearch, updateSearchTerm } = this.props;

    // var { defaultToCatalogLandingPage } = window.serverConfig.featureFlags;
    var defaultToCatalogLandingPage = true;

    if (!defaultToCatalogLandingPage) {
      return null;
    }

    return (
      <div className="catalog-landing-page-search">
        <Searchbox
          autoFocus={true}
          defaultQuery={term}
          onChange={updateSearchTerm}
          onClear={clearSearch}
          onSearch={performSearch} />
      </div>
    );
  }
}

Search.propTypes = {
  term: PropTypes.string,
  performSearch: PropTypes.func.isRequired,
  updateSearchTerm: PropTypes.func.isRequired,
  clearSearch: PropTypes.func.isRequired
};

const mapStateToProps = (state) => state.search;

function mapDispatchToProps(dispatch) {
  return {
    clearSearch: function(term) {
      dispatch(emitMixpanelEvent({
        name: 'Catalog landing page clear search',
        term: term
      }));
      dispatch(search.clearSearch(term));
    },
    performSearch: function(term) {
      dispatch(emitMixpanelEvent({
        name: 'Catalog landing page search',
        term: term
      }));

      dispatch(search.performSearch(term));
    },
    updateSearchTerm: function(term) {
      dispatch(search.updateSearchTerm(term));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Search);
