import Status from './georegion-status';
import GeoregionAdminRow from './georegion-admin-row';
import React, { PropTypes } from 'react';

function t(str, props) {
  return $.t('screens.admin.georegions.' + str, props);
}

// This defines the necessary shape for each item that will occupy a table row.
// Jobs are massaged into a shape that closely resembles completed curated regions.
const GeoregionPropType = PropTypes.shape({
  enabledFlag: PropTypes.bool.isRequired,
  id: PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired
});

const GeoregionAdminTable = React.createClass({
  propTypes: {
    allowEnablement: PropTypes.bool,
    authenticityToken: PropTypes.string.isRequired,
    baseUrlPath: PropTypes.string.isRequired,
    onEdit: PropTypes.func,
    onEnableSuccess: PropTypes.func.isRequired,
    rows: PropTypes.arrayOf(GeoregionPropType).isRequired
  },
  getDefaultProps() {
    return {
      allowEnablement: true,
      onEdit: _.noop,
      rows: []
    };
  },
  renderRows(rows) {
    const {
      allowEnablement,
      authenticityToken,
      baseUrlPath,
      onEdit,
      onEnableSuccess
    } = this.props;

    const baseRowProps = {
      allowEnablement,
      authenticityToken,
      baseUrlPath
    };

    const renderActions = _.any(rows, 'featurePk');

    return rows.map((row) => {
      const {
        enabledFlag,
        featurePk,
        status, // slice out and replace in rowProps
        ...itemProps
      } = row;

      const rowStatus = (() => {
        if (featurePk) {
          // The existence of the featurePk field is suitable to distinguish
          // available curated regions (either enabled or disabled).
          return enabledFlag ? Status.ENABLED : Status.DISABLED;
        } else {
          // Using existence of latest_event property as an indication that
          // the item comes from ISS, which means it's a failed job.
          // There are several equally valid ways of disambiguating failed
          // from in-progress/queued jobs, but none seem completely satisfying.
          return itemProps.latest_event ? Status.FAILED : Status.PROGRESS;
        }
      })();

      const actionURL = featurePk ? `${baseUrlPath}${itemProps.id}` : '';

      const rowProps = {
        action: actionURL,
        status: rowStatus,
        renderActions,
        key: itemProps.id,
        onEnableSuccess: (response) => onEnableSuccess(itemProps.id, !enabledFlag, response),
        onEdit: () => onEdit(itemProps.id),
        ...itemProps,
        ...baseRowProps
      };
      return (
        <GeoregionAdminRow {...rowProps} />
      );
    });
  },
  render() {
    const {
      authenticityToken,
      rows
    } = this.props;

    // If we don't have any finished curated regions, there are no actions available.
    const renderActions = _.any(rows, 'featurePk');

    return (
      <table className="gridList georegions-table" cellSpacing="0">
        <colgroup>
          <col className="name" />
          <col className="status" />
          { renderActions ? (<col className="date-added" />) : null }
          { renderActions ? (<col className="edit-action" />) : null }
        </colgroup>
        <thead>
        <tr>
          <th className="name"><div>{ t('region_name') }</div></th>
          <th className="status"><div>{ t('enabled?') }</div></th>
          { renderActions ? (<th className="date-added"><div>{ t('date_added') }</div></th>) : null }
          { renderActions ? (<th className="edit-action"><div>{ t('actions') }</div></th>) : null }
        </tr>
        </thead>
        <tbody>
        {this.renderRows(rows, authenticityToken)}
        </tbody>
      </table>
    );
  }
});

export default GeoregionAdminTable;
