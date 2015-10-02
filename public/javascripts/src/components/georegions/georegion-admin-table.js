(() => {

  const PropTypes = React.PropTypes;
  let georegionsComponentsNS = blist.namespace.fetch('blist.georegions.components');
  const { GeoregionAdminRow } = georegionsComponentsNS;

  function t(str, props) {
    return $.t('screens.admin.georegions.' + str, props);
  }

  const GeoregionPropType = PropTypes.shape({
    enabledFlag: PropTypes.bool.isRequired,
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired
  });

  georegionsComponentsNS.GeoregionAdminTable  = React.createClass({
    propTypes: {
      allowEnablement: PropTypes.bool,
      authenticityToken: PropTypes.string.isRequired,
      baseUrlPath: PropTypes.string.isRequired,
      onEdit: PropTypes.func,
      onEnableSuccess: PropTypes.func.isRequired,
      renderActions: PropTypes.bool,
      rows: PropTypes.arrayOf(GeoregionPropType).isRequired
    },
    getDefaultProps: function() {
      return {
        allowEnablement: true,
        onEdit: _.noop,
        renderActions: true,
        rows: []
      };
    },
    renderRows: function(rows) {
      const {
        allowEnablement,
        authenticityToken,
        baseUrlPath,
        onEdit,
        onEnableSuccess,
        renderActions
      } = this.props;

      const baseRowProps = {
        allowEnablement,
        authenticityToken,
        baseUrlPath,
        renderActions
      };

      return rows.map(function(row) {
        const {
          enabledFlag,
          ...itemProps
        } = row;
        const rowProps = {
          action: `${baseUrlPath}${itemProps.id}`,
          isEnabled: enabledFlag,
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
    render: function() {
      const {
        authenticityToken,
        renderActions,
        rows
      } = this.props;

      return (
        <table className="gridList georegions-table" cellSpacing="0">
          <colgroup>
            <col className="name" />
            <col className="toggle-enabled" />
            { renderActions ? (<col className="edit-action" />) : null }
            { renderActions ? (<col className="remove-action" />) : null }
            <col className="edit-action" />
            <col className="remove-action" />
          </colgroup>
          <thead>
          <tr>
            <th className="name"><div>{ t('region_name') }</div><span className="icon"></span></th>
            <th className="toggle-enabled"><div>{ t('enabled?') }</div><span className="icon"></span></th>
            { renderActions ? (<th className="edit-action"><div>{ t('actions') }</div><span className="icon"></span></th>) : null }
            { renderActions ? (<th className="remove-action"></th>) : null }
          </tr>
          </thead>
          <tbody>
          {this.renderRows(rows, authenticityToken)}
          </tbody>
        </table>
      );
    }
  });

})();
