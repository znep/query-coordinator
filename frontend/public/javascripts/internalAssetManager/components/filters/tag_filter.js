import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';

import SearchboxFilter from './searchbox_filter';
import connectLocalization from 'common/i18n/components/connectLocalization';

import * as filters from '../../actions/filters';

export class TagFilter extends React.Component {
  render() {
    const { tag, changeTag, I18n, domainTags } = this.props;

    return (
      <div className="filter-section tags">
        <label className="filter-label">
          {I18n.t('internal_asset_manager.filters.tags.label')}
        </label>
        <SearchboxFilter
          inputId="tag-filter"
          options={_.map(domainTags, (curTag) => ({ title: curTag, value: curTag }))}
          onSelection={changeTag}
          placeholder={I18n.t('internal_asset_manager.filters.tags.placeholder')}
          value={tag} />
      </div>
    );
  }
}

TagFilter.propTypes = {
  tag: PropTypes.string,
  changeTag: PropTypes.func.isRequired,
  I18n: PropTypes.object.isRequired,
  domainTags: PropTypes.array.isRequired
};

const mapStateToProps = (state) => ({
  tag: state.filters.tags,
  domainTags: state.filters.domainTags
});

const mapDispatchToProps = (dispatch) => ({
  changeTag: (value) => dispatch(filters.changeTag(value))
});

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(TagFilter));
