import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import I18n from 'common/i18n';
import classNames from 'classnames';

export class AssetInventoryLink extends Component {
  render() {
    const { buttonDisabled, showInitializeButton } = this.props;

    const scope = 'internal_asset_manager.asset_inventory_dataset_link';
    const getTranslation = (key) => I18n.t(key, { scope });

    if (showInitializeButton) {
      const authenticityInput = (
        <input
          type="hidden"
          name="authenticity_token"
          id="authenticity_token"
          value={_.get(window, 'serverConfig.csrfToken')} />
      );

      return (
        <form method="post" action="/admin/initialize_asset_inventory">
          <button className="btn btn-primary btn-inverse" type="submit">
            {getTranslation('initialize')}
          </button>
          {authenticityInput}
        </form>
      );
    } else {
      const buttonClassnames = classNames('btn btn-primary btn-inverse', {
        'btn-disabled': buttonDisabled
      });
      const buttonTitle = buttonDisabled ? getTranslation('disabled_tooltip') : null;

      return (
        <a href="/admin/asset_inventory">
          <button className={buttonClassnames} disabled={buttonDisabled} title={buttonTitle}>
            {getTranslation('asset_inventory_dataset')}
          </button>
        </a>
      );
    }
  }
}

AssetInventoryLink.propTypes = {
  buttonDisabled: PropTypes.bool.isRequired,
  showInitializeButton: PropTypes.bool.isRequired
};

const mapStateToProps = (state) => ({
  buttonDisabled: !!_.get(state.assetInventoryViewModel, 'asset_inventory.button_disabled'),
  showInitializeButton: !!_.get(state.assetInventoryViewModel, 'asset_inventory.show_initialize_button')
});

export default connect(mapStateToProps)(AssetInventoryLink);
