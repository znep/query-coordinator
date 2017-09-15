import Status from './georegion-status';
import GeoregionAdminRow from './georegion-admin-row';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

function t(str, props) {
  return $.t('screens.admin.georegions.' + str, props);
}

// This defines the necessary shape for each item that will occupy a table row.
// Jobs are massaged into a shape that closely resembles completed curated regions.
const GeoregionPropType = PropTypes.shape({
  defaultFlag: PropTypes.bool.isRequired,
  enabledFlag: PropTypes.bool.isRequired,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired
});

class GeoregionAdminTable extends Component {
  renderRows(rows) {
    const {
      allowDefaulting,
      authenticityToken,
      baseUrlPath,
      defaultLimit,
      onEdit,
      onEnableSuccess,
      onDefaultSuccess
    } = this.props;

    const baseRowProps = {
      allowDefaulting,
      authenticityToken,
      baseUrlPath,
      defaultLimit
    };

    const renderActions = _.any(rows, 'featurePk');

    return rows.map((row) => {
      const {
        defaultFlag,
        enabledFlag,
        featurePk,
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

      const decoratedOnEnableSuccess = (response) => {
        // Toggle defaultFlag if disabling region
        const newDefaultState = enabledFlag ? false : defaultFlag;

        return onEnableSuccess(itemProps.id, !enabledFlag, newDefaultState, response);
      };

      const rowProps = {
        action: actionURL,
        defaultStatus: defaultFlag,
        status: rowStatus,
        renderActions,
        key: itemProps.id,
        onDefaultSuccess: (response) => onDefaultSuccess(itemProps.id, !defaultFlag, response),
        onEnableSuccess: decoratedOnEnableSuccess,
        onEdit: () => onEdit(itemProps.id),
        ...itemProps,
        ...baseRowProps
      };
      return (
        <GeoregionAdminRow {...rowProps} />
      );
    });
  }
  render() {
    const {
      authenticityToken,
      defaultCount,
      defaultLimit,
      rows
    } = this.props;

    // If we don't have any finished curated regions, there are no actions available.
    const renderActions = _.any(rows, 'featurePk');

    return (
      <table className="gridList georegions-table" cellSpacing="0">
        <colgroup>
          <col className="name" />
          <col className="status" />
          {renderActions ? (<col className="default" />) : null}
          {renderActions ? (<col className="date-added" />) : null}
          {renderActions ? (<col className="edit-action" />) : null}
        </colgroup>
        <thead>
          <tr>
            <th className="name"><div>{t('region_name')}</div></th>
            <th className="status"><div>{t('enabled?')}</div></th>
            {renderActions ? (
              <th className="default">
                <div>
                  {t('default_georegions', { count: String(defaultCount), limit: String(defaultLimit) })}
                  <span className="icon-info"></span>
                </div>
              </th>
            ) : null}
            {renderActions ? (<th className="date-added"><div>{t('date_added')}</div></th>) : null}
            {renderActions ? (<th className="edit-action"><div>{t('actions')}</div></th>) : null}
          </tr>
        </thead>
        <tbody>
          {this.renderRows(rows, authenticityToken)}
        </tbody>
      </table>
    );
  }
}

GeoregionAdminTable.propTypes = {
  allowDefaulting: PropTypes.bool,
  authenticityToken: PropTypes.string.isRequired,
  baseUrlPath: PropTypes.string.isRequired,
  defaultCount: PropTypes.number.isRequired,
  defaultLimit: PropTypes.number.isRequired,
  onDefaultSuccess: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  onEnableSuccess: PropTypes.func.isRequired,
  rows: PropTypes.arrayOf(GeoregionPropType).isRequired
};

GeoregionAdminTable.defaultProps = {
  allowDefaulting: true,
  onEdit: _.noop,
  rows: []
};

export default GeoregionAdminTable;
