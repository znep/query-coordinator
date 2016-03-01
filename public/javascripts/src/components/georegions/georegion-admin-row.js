import Status from './georegion-status';
import RowStatusWidget from './row-status-widget';
import React, { PropTypes } from 'react';

function t(str, props) {
  return $.t('screens.admin.georegions.' + str, props);
}

const GeoregionAdminRow = React.createClass({
  propTypes: {
    action: PropTypes.string.isRequired,
    allowEnablement: PropTypes.bool,
    authenticityToken: PropTypes.string.isRequired,
    dateAdded: PropTypes.number,
    status: PropTypes.oneOf(_.values(Status)).isRequired,
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
  renderRowStatusWidget() {
    const {
      status,
      onEnableSuccess,
      ...props
    } = this.props;

    return (
      <RowStatusWidget
        status={status}
        onSuccess={onEnableSuccess}
        {...props}
        />
    );
  },
  renderDateAddedCell() {
    const { dateAdded, status } = this.props;

    switch (status) {
      case Status.ENABLED:
      case Status.DISABLED:
        return (
          <td className="date-added">
            <span>{moment.unix(dateAdded).format('LL')}</span>
          </td>
        );
      case Status.PROGRESS:
      case Status.FAILED:
        return null;
    }
  },
  renderEditCell() {
    const {
      onEdit,
      status
    } = this.props;

    switch (status) {
      case Status.ENABLED:
      case Status.DISABLED:
        return (
          <td className="edit-action">
            <button className="button" type="button" onClick={onEdit}>{t('edit')}</button>
          </td>
        );
      case Status.PROGRESS:
      case Status.FAILED:
        return null;
    }
  },
  render() {
    const { renderActions, status } = this.props;
    const shouldRowExtend = _.includes([Status.PROGRESS, Status.FAILED], status) && renderActions;
    const colspan = shouldRowExtend ? 3 : 1;

    return (
      <tr className="item">
        <td className="name">{this.props.name}</td>
        <td className="status" colSpan={colspan}>
          {this.renderRowStatusWidget()}
        </td>
        {this.renderDateAddedCell()}
        {this.renderEditCell()}
      </tr>
    );
  }
});

export default GeoregionAdminRow;
