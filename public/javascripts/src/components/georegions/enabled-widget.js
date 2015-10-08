(() => {

  const PropTypes = React.PropTypes;
  let componentsNS = blist.namespace.fetch('blist.components');
  const { classNames } = blist.namespace.fetch('blist.components.utils');
  let georegionsNS = blist.namespace.fetch('blist.georegions');
  let georegionsComponentsNS = blist.namespace.fetch('blist.georegions.components');
  const { FormButton } = componentsNS;

  var t = function(str, props) {
    return $.t('screens.admin.georegions.' + str, props);
  };

  georegionsComponentsNS.EnabledWidget = React.createClass({
    propTypes: {
      action: PropTypes.string.isRequired,
      allowEnablement: PropTypes.bool,
      authenticityToken: PropTypes.string.isRequired,
      isEnabled: PropTypes.bool.isRequired,
      onSuccess: PropTypes.func
    },
    getDefaultProps: function() {
      return {
        allowEnablement: true,
        onSuccess: _.noop
      };
    },
    render: function() {
      const {
        action,
        allowEnablement,
        authenticityToken,
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
        title: isDisabled ? t('enabled_georegions_limit', { limit: georegionsNS.maximumEnabledCount }) : null,
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

})();
