import Status from './georegion-status';
import RowStatusWidget from './row-status-widget';
import RowDefaultWidget from './row-default-widget';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import moment from 'moment';

function t(str, props) {
  return $.t('screens.admin.georegions.' + str, props);
}

class GeoregionAdminRow extends Component {
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
        {...props} />
    );
  }
  renderRowDefaultWidget() {
    const {
      onDefaultSuccess,
      status,
      ...props
    } = this.props;

    switch (status) {
      case Status.ENABLED:
      case Status.DISABLED:
        return (
          <td className="default">
            <RowDefaultWidget
              enabledStatus={status}
              onSuccess={onDefaultSuccess}
              {...props} />
          </td>
        );
      case Status.PROGRESS:
      case Status.FAILED:
        return null;
    }
  }
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
  }
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
            <button className="button" type="button" aria-label={t('edit_label')} onClick={onEdit}>
              {t('edit')}
            </button>
          </td>
        );
      case Status.PROGRESS:
      case Status.FAILED:
        return null;
    }
  }
  render() {
    const { renderActions, status } = this.props;
    const shouldRowExtend = _.includes([Status.PROGRESS, Status.FAILED], status) && renderActions;
    const colspan = shouldRowExtend ? 4 : 1;

    return (
      <tr className="item">
        <td className="name">{this.props.name}</td>
        <td className="status" colSpan={colspan}>
          {this.renderRowStatusWidget()}
        </td>
        {this.renderRowDefaultWidget()}
        {this.renderDateAddedCell()}
        {this.renderEditCell()}
      </tr>
    );
  }
}

GeoregionAdminRow.propTypes = {
  action: PropTypes.string.isRequired,
  allowDefaulting: PropTypes.bool,
  authenticityToken: PropTypes.string.isRequired,
  dateAdded: PropTypes.number,
  status: PropTypes.oneOf(_.values(Status)).isRequired,
  defaultLimit: PropTypes.number.isRequired,
  defaultStatus: PropTypes.bool.isRequired,
  name: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDefaultSuccess: PropTypes.func.isRequired,
  onEnableSuccess: PropTypes.func.isRequired,
  renderActions: PropTypes.bool.isRequired
};

GeoregionAdminRow.defaultProps = {
  allowDefaulting: true
};

export default GeoregionAdminRow;
