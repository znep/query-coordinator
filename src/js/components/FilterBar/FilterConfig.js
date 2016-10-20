import React, { PropTypes } from 'react';
import { translate as t } from '../../common/I18n';

// TODO This component can't be a stateless component because its parent attaches a ref to it.
// Currently the component is simple enough that the linter thinks it should be a stateless
// component, so we override that lint rule here.  Once this component becomes more complicated,
// remove this comment and the eslint-disable-line commentwe use a lint override.
export default React.createClass({ // eslint-disable-line react/prefer-stateless-function
  propTypes: {
    onRemove: PropTypes.func.isRequired
  },

  render() {
    return (
      <div className="filter-config">
        <div className="filter-footer">
          <button className="btn btn-sm btn-transparent remove-btn" onClick={this.props.onRemove}>
            <span className="icon-close-2" />
            {t('filter_bar.remove_filter')}
          </button>
        </div>
      </div>
    );
  }
});
