// This component needs to be ported to ES6 classes, see EN-16506.
/* eslint-disable react/prefer-es6-class */
import _ from 'lodash';
import React, { PropTypes } from 'react';
import I18n from 'common/i18n';
import { getFirstActionableElement } from 'common/a11y';

export default React.createClass({
  propTypes: {
    filter: PropTypes.object.isRequired,
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
                <span className="option-label">{I18n.t('shared.components.filter_bar.config.hidden_label')}</span>
                <div className="setting-description">{I18n.t('shared.components.filter_bar.config.hidden_description')}</div>
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
                <span className="option-label">{I18n.t('shared.components.filter_bar.config.viewers_can_edit_label')}</span>
                <div className="setting-description">
                  {I18n.t('shared.components.filter_bar.config.viewers_can_edit_description')}
                </div>
              </label>
            </div>
          </div>
        </form>
      </div>
    );
  }
});
