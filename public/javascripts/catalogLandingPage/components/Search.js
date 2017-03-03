import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import { emitMixpanelEvent } from '../actions/mixpanel';
import * as search from '../actions/search';

export class Search extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, 'onChange', 'onPerformSearch', 'onClearSearch');
  }

  componentDidMount() {
    if (this.refs.searchElement) {
      this.refs.searchElement.focus();
    } else {
      console.warn('this.refs.searchElement is undefined.');
    }
  }

  onChange(event) {
    this.props.updateSearchTerm(event.target.value);
  }

  onPerformSearch(term) {
    return function(event) {
      event.preventDefault();
      this.props.performSearch(term);
    }.bind(this);
  }

  onClearSearch(term) {
    return function(event) {
      event.preventDefault();
      this.props.clearSearch(term);
    }.bind(this);
  }

  render() {
    var { term } = this.props;

    // var { defaultToCatalogLandingPage } = window.serverConfig.featureFlags;
    var defaultToCatalogLandingPage = true;

    if (!defaultToCatalogLandingPage) {
      return null;
    }

    return (
      <div className="search-bar">
        <form className="catalog-landing-page-search" onSubmit={this.onPerformSearch(term)}>
          <span className="catalog-landing-page-search-icon icon-search"></span>
          <input
            className="catalog-landing-page-search-control searchBox"
            type="text"
            value={term}
            name="search"
            ref="searchElement"
            title={_.get(I18n, 'search.hint', 'Search')}
            onChange={this.onChange}
            placeholder={_.get(I18n, 'search.hint', 'Search')} />
          <span className="catalog-landing-page-search-mobile-search-button">
            <span className="icon-search"></span>
          </span>
          <span className="catalog-landing-page-clear-search-icon" onClick={this.onClearSearch(term)}>
            <span className="icon-close-2"></span>
          </span>
        </form>
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
    updateSearchTerm: function(term) {
      dispatch(search.updateSearchTerm(term));
    },

    performSearch: function(term) {
      dispatch(emitMixpanelEvent({
        name: 'Catalog landing page search',
        term: term
      }));

      dispatch(search.performSearch(term));
    },

    clearSearch: function(term) {
      dispatch(emitMixpanelEvent({
        name: 'Catalog landing page clear search',
        term: term
      }));
      dispatch(search.clearSearch(term));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Search);
