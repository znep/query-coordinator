import FormButton from '../form-button';
import { classNames } from '../utils';
import React, { PropTypes } from 'react';

const georegionsNS = blist.namespace.fetch('blist.georegions');

function t(str, props) {
  return $.t('screens.admin.georegions.' + str, props);
}

const EnabledWidget = React.createClass({
  propTypes: {
    action: PropTypes.string.isRequired,
    allowEnablement: PropTypes.bool,
    authenticityToken: PropTypes.string.isRequired,
    disabledTitle: PropTypes.string.isRequired,
    isEnabled: PropTypes.bool.isRequired,
    onSuccess: PropTypes.func
  },
  getDefaultProps() {
    return {
      allowEnablement: true,
      disabledTitle: t('enabled_georegions_limit', { limit: georegionsNS.maximumEnabledCount }),
      onSuccess: _.noop
    };
  },
  render() {
    const {
      action,
      allowEnablement,
      authenticityToken,
      disabledTitle,
      isEnabled,
      onSuccess
    } = this.props;
    const isEnabledLabel = isEnabled ? t('enabled_yes') : t('enabled_no');
    const actionToPerform = isEnabled ? 'disable' : 'enable';
    const isDisabled = !isEnabled && !allowEnablement;
    const formButtonProps = {
      action: `${action}/${actionToPerform}`,
      authenticityToken,
      disabled: isDisabled,
      method: 'put',
      onSuccess,
      title: isDisabled ? disabledTitle : null,
      value: t(actionToPerform)
    };
    const className = classNames(
      'enabled-widget-label',
      isEnabled ? 'is-enabled' : 'is-disabled'
    );

    return (
      <div>
        <span className={className}>{isEnabledLabel}</span>
        {' '}
        <FormButton {...formButtonProps} />
      </div>
    );
  }
});

export default EnabledWidget;
