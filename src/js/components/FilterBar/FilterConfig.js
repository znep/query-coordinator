import _ from 'lodash';
import React, { PropTypes } from 'react';
import { translate as t } from '../../common/I18n';
import { getFirstActionableElement } from '../../common/a11y';

export default React.createClass({
  propTypes: {
    filter: PropTypes.object.isRequired,
    onRemove: PropTypes.func.isRequired,
    onUpdate: PropTypes.func.isRequired
  },

  componentDidMount() {
    const actionableElement = getFirstActionableElement(this.configElement);
    if (actionableElement) {
      actionableElement.focus();
    }
  },

  setFilterHidden(bool) {
    return () => {
      const { filter, onUpdate } = this.props;
      const newFilter = _.merge({}, filter, {
        isHidden: bool
      });

      onUpdate(newFilter);
    };
  },

  render() {
    const { filter } = this.props;

    return (
      <div className="filter-config" ref={(ref) => this.configElement = ref}>
        <form className="filter-options">
          <div className="radiobutton">
            <div>
              <input
                id="hidden"
                type="radio"
                checked={filter.isHidden}
                onChange={this.setFilterHidden(true)} />
              <label htmlFor="hidden">
                <span className="fake-radiobutton" />
                <span className="option-label">{t('filter_bar.config.hidden_label')}</span>
                <div className="small">{t('filter_bar.config.hidden_description')}</div>
              </label>
            </div>
            <div>
              <input
                id="viewers-can-edit"
                type="radio"
                checked={!filter.isHidden}
                onChange={this.setFilterHidden(false)} />
              <label htmlFor="viewers-can-edit">
                <span className="fake-radiobutton" />
                <span className="option-label">{t('filter_bar.config.viewers_can_edit_label')}</span>
                <div className="small">{t('filter_bar.config.viewers_can_edit_description')}</div>
              </label>
            </div>
          </div>
        </form>
        <div className="filter-footer">
          <button className="btn btn-sm btn-transparent remove-btn" onClick={this.props.onRemove}>
            <span className="socrata-icon-close-2" />
            {t('filter_bar.remove_filter')}
          </button>
        </div>
      </div>
    );
  }
});
