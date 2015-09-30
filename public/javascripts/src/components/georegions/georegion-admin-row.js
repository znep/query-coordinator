(() => {

  const PropTypes = React.PropTypes;
  let componentsNS = blist.namespace.fetch('blist.components');
  let georegionsComponentsNS = blist.namespace.fetch('blist.georegions.components');
  const { EnabledWidget } = georegionsComponentsNS;
  const { FormButton } = componentsNS;

  georegionsComponentsNS.GeoregionAdminRow = React.createClass({
    propTypes: {
      action: PropTypes.string.isRequired,
      allowEnablement: PropTypes.bool,
      authenticityToken: PropTypes.string.isRequired,
      isEnabled: PropTypes.bool.isRequired,
      name: PropTypes.string.isRequired,
      onEdit: PropTypes.func.isRequired,
      onEnableSuccess: PropTypes.func.isRequired,
      renderActions: PropTypes.bool.isRequired
    },
    getDefaultProps: function() {
      return {
        allowEnablement: true
      };
    },
    renderEnabledWidget: function() {
      const {
        isEnabled,
        onEnableSuccess,
        ...props
        } = this.props;

      return (
        <EnabledWidget
          isEnabled={isEnabled}
          onSuccess={onEnableSuccess}
          {...props}
          />
      );
    },
    render: function() {
      const { action, authenticityToken, name, renderActions, onEdit } = this.props;
      return (
        <tr className="item">
          <td className="name">{name}</td>
          <td className="toggle-enabled">
            {this.renderEnabledWidget()}
          </td>
          { renderActions ?
            (<td className="edit-action">
              <button className="button" type="button" onClick={onEdit}>Edit</button>
            </td>)
            : null }
          { renderActions ?
            (<td className="remove-action">
              <FormButton action={action} method="delete" authenticityToken={authenticityToken} value="Remove" />
            </td>)
            : null }
        </tr>
      );
    }
  });

})();
