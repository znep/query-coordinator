(() => {

  const PropTypes = React.PropTypes;
  let componentsNS = blist.namespace.fetch('blist.components');
  const { classNames } = blist.namespace.fetch('blist.components.utils');

  componentsNS.FormControls = React.createClass({
    propTypes: {
      onCancel: PropTypes.func,
      onSave: PropTypes.func,
      onBack: PropTypes.func,
      saveDisabled: PropTypes.bool
    },
    getDefaultProps: function() {
      return {
        saveDisabled: false
      };
    },
    renderButton: function(handlerName, label, disabled) {
      if (!_.isUndefined(this.props[handlerName])) {
        const className = classNames('button', { disabled });
        return (
          <button
            className={className}
            disabled={disabled}
            onClick={ () => { this.props[handlerName](); } }
            type="button"
            >
            {label}
          </button>
        )
      }
    },
    render: function() {
      const {
        saveDisabled
      } = this.props;

      return (
        <div className="line clearfix form-controls">
          {this.renderButton('onCancel', $.t('core.dialogs.cancel'))}
          {this.renderButton('onSave', $.t('core.dialogs.save'), saveDisabled)}
          {this.renderButton('onBack', $.t('core.dialog.back'))}
        </div>
      );
    }
  });

})();
