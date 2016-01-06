import EnabledWidget from './enabled-widget';
import React, { PropTypes } from 'react';

const GeoregionAdminRow = React.createClass({
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
  getDefaultProps() {
    return {
      allowEnablement: true
    };
  },
  renderEnabledWidget() {
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
  render() {
    const {
      name,
      renderActions,
      onEdit
    } = this.props;

    return (
      <tr className="item">
        <td className="name">{name}</td>
        <td className="toggle-enabled">
          {this.renderEnabledWidget()}
        </td>
        { renderActions ?
          (<td className="edit-action">
            <button className="button" type="button" onClick={onEdit}>{$.t('screens.admin.georegions.edit')}</button>
          </td>)
          : null }
        { renderActions ?
          (<td className="remove-action"></td>)
          : null }
      </tr>
    );
  }
});

export default GeoregionAdminRow;
