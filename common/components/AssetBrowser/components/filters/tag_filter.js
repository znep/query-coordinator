import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import SearchboxFilter from './searchbox_filter';
import I18n from 'common/i18n';

import * as filters from '../../actions/filters';

export class TagFilter extends Component {
  render() {
    const { tag, changeTag, domainTags } = this.props;

    return (
      <div className="filter-section tags">
        <label className="filter-label">
          {I18n.t('shared.asset_browser.filters.tags.label')}
        </label>
        <SearchboxFilter
          inputId="tag-filter"
          options={_.map(domainTags, (curTag) => ({ title: curTag, value: curTag }))}
          onSelection={changeTag}
          placeholder={I18n.t('shared.asset_browser.filters.tags.placeholder')}
          value={tag} />
      </div>
    );
  }
}

TagFilter.propTypes = {
  tag: PropTypes.string,
  changeTag: PropTypes.func.isRequired,
  domainTags: PropTypes.array.isRequired
};

const mapStateToProps = (state) => ({
  tag: state.filters.tags,
  domainTags: state.filters.domainTags
});

const mapDispatchToProps = (dispatch) => ({
  changeTag: (value) => dispatch(filters.changeTag(value))
});

export default connect(mapStateToProps, mapDispatchToProps)(TagFilter);