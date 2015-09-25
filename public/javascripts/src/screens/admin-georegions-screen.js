var t = function(str, props) {
  return $.t('screens.admin.georegions.' + str, props);
};

(function() {
  var PropTypes = React.PropTypes;
  const { FlashMessage, FormButton } = blist.namespace.fetch('blist.components');
  var georegionsNS = blist.namespace.fetch('blist.georegions');
  georegionsNS.flash = georegionsNS.flash || {};

  var EnabledWidget = React.createClass({
    propTypes: {
      action: PropTypes.string.isRequired,
      allowEnablement: PropTypes.bool,
      authenticityToken: PropTypes.string.isRequired,
      isEnabled: PropTypes.bool.isRequired
    },
    getDefaultProps: function() {
      return {
        allowEnablement: true
      };
    },
    render: function() {
      const { action, allowEnablement, authenticityToken, isEnabled, onSubmit } = this.props;
      const isEnabledLabel = isEnabled ? t('enabled_yes') : t('enabled_no');
      const enabledClassName = isEnabled ? 'is-enabled' : 'is-disabled';
      const actionToPerform = isEnabled ? 'disable' : 'enable';
      const isDisabled = !isEnabled && !allowEnablement;
      const formButtonProps = {
        action: `${action}/${actionToPerform}`,
        authenticityToken,
        disabled: isDisabled,
        method: 'put',
        onSubmit,
        title: isDisabled ? t('enabled_georegions_limit') : null,
        value: t(actionToPerform)
      };
      const className = _.compact(['enabled-widget-label', enabledClassName]).join(' ');

      return (
        <div>
          <span className={className}>{isEnabledLabel}</span>
          {' '}
          <FormButton {...formButtonProps} />
        </div>
      );
    }
  });

  var GeoregionAdminRow = React.createClass({
    propTypes: {
      action: PropTypes.string.isRequired,
      allowEnablement: PropTypes.bool,
      authenticityToken: PropTypes.string.isRequired,
      isEnabled: PropTypes.bool.isRequired,
      name: PropTypes.string.isRequired,
      renderActions: PropTypes.bool.isRequired
    },
    getDefaultProps: function() {
      return {
        allowEnablement: true
      };
    },
    renderEnabledWidget: function() {
      const { action, authenticityToken, allowEnablement, id, isEnabled } = this.props;
      const onSubmit = (response) => {
        if (response.success) {
          setFlash(response.message, 'notice');
          setGeoregionEnabled(id, !isEnabled);
        }
        else if (response.error) {
          setFlash(response.message, 'error');
        }
      };

      return (
        <EnabledWidget
          action={action}
          authenticityToken={authenticityToken}
          allowEnablement={allowEnablement}
          isEnabled={isEnabled}
          onSubmit={onSubmit} />
      );
    },
    render: function() {
      var props = this.props;
      return (
        <tr className="item">
          <td className="name">{props.name}</td>
          <td className="toggle-enabled">
            {this.renderEnabledWidget()}
          </td>
          { props.renderActions ?
            (<td className="edit-action">
              <FormButton action={props.action} method="put" authenticityToken={props.authenticityToken} value="Edit" />
            </td>)
            : null }
          { props.renderActions ?
            (<td className="remove-action">
              <FormButton action={props.action} method="delete" authenticityToken={props.authenticityToken} value="Remove" />
            </td>)
            : null }
        </tr>
      );
    }
  });

  var GeoregionPropType = PropTypes.shape({
    enabledFlag: PropTypes.bool.isRequired,
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired
  });

  var GeoregionAdminTable = React.createClass({
    propTypes: {
      allowEnablement: PropTypes.bool,
      authenticityToken: PropTypes.string.isRequired,
      baseUrlPath: PropTypes.string.isRequired,
      renderActions: PropTypes.bool,
      rows: PropTypes.arrayOf(GeoregionPropType).isRequired
    },
    getDefaultProps: function() {
      return {
        allowEnablement: true,
        renderActions: true,
        rows: []
      };
    },
    renderRows: function(rows) {
      const { allowEnablement, authenticityToken, baseUrlPath, renderActions } = this.props;
      const baseRowProps = {
        allowEnablement,
        authenticityToken,
        baseUrlPath,
        renderActions
      };
      return rows.map(function({ enabledFlag, id, name }) {
        const rowProps = {
          action: `${baseUrlPath}${id}`,
          id,
          isEnabled: enabledFlag,
          key: id,
          name,
          ...baseRowProps
        };
        return (
          <GeoregionAdminRow {...rowProps} />
        );
      });
    },
    render: function() {
      var props = this.props;
      return (
        <table className="gridList georegions-table" cellSpacing="0">
          <colgroup>
            <col className="name" />
            <col className="toggle-enabled" />
            { props.renderActions ? (<col className="edit-action" />) : null }
            { props.renderActions ? (<col className="remove-action" />) : null }
            <col className="edit-action" />
            <col className="remove-action" />
          </colgroup>
          <thead>
          <tr>
            <th className="name"><div>{ t('region_name') }</div><span className="icon"></span></th>
            <th className="toggle-enabled"><div>{ t('enabled?') }</div><span className="icon"></span></th>
            { props.renderActions ? (<th className="edit-action"><div>{ t('actions') }</div><span className="icon"></span></th>) : null }
            { props.renderActions ? (<th className="remove-action"></th>) : null }
          </tr>
          </thead>
          <tbody>
          {this.renderRows(props.rows, props.authenticityToken)}
          </tbody>
        </table>
      );
    }
  });

  function setFlash(message, type) {
    georegionsNS.flash = [{ message, type }];
    renderPage();
  }

  function setGeoregionEnabled(id, enabledFlag) {
    georegionsNS.georegions = _.map(georegionsNS.georegions, function(georegion) {
      if (georegion.id === id) {
        return _.extend({}, georegion, { enabledFlag });
      } else {
        return georegion;
      }
    });
    renderPage();
  }

  function renderTables(georegions, allowEnablement) {
    const authenticityToken = $('.georegions-controls-custom [name="authenticity_token"]').value();
    const baseUrlPath = '/admin/geo/';
    const [defaultBoundaries, customBoundaries] = _.partition(georegions, _.property('defaultFlag'));
    const baseTableProps = {
      allowEnablement,
      authenticityToken,
      baseUrlPath
    };

    React.render(
      <GeoregionAdminTable
        rows={customBoundaries}
        {...baseTableProps} />,
      $('.georegions-custom .gridListWrapper').get(0)
    );

    React.render(
      <GeoregionAdminTable
        renderActions={false}
        rows={defaultBoundaries}
        {...baseTableProps} />,
      $('.georegions-default .gridListWrapper').get(0)
    );
  }

  function renderPageSubtitle(enabledCount, availableCount) {
    const pageSubtitle = t('page_subtitle', {
      enabled_count: String(enabledCount),
      available_count: String(availableCount)
    });

    React.render(
      <span>{pageSubtitle}</span>,
      $('#georegions-page-subtitle').get(0)
    );
  }

  function renderFlashMessage(messages) {
    React.render(
      <FlashMessage messages={messages} />,
      $('#flash-container').get(0)
    );
  }

  function renderPage() {
    const georegions = georegionsNS.georegions;
    const enabledBoundaries = _.filter(georegions, _.property('enabledFlag'));
    const allowEnablement = enabledBoundaries.length < georegionsNS.maximumEnabledCount;

    renderTables(georegions, allowEnablement);
    renderPageSubtitle(enabledBoundaries.length, georegionsNS.maximumEnabledCount);
    renderFlashMessage(georegionsNS.flash);
  }

  georegionsNS.renderPage = renderPage;

  georegionsNS.components = {
    GeoregionAdminTable,
    GeoregionAdminRow,
    FormButton,
    EnabledWidget
  };

  var commonNS = blist.namespace.fetch('blist.common');

  commonNS.georegionSelected = function(newGeoregionData) {
    $('#selectDataset').jqmHide();
    georegionsNS.georegions || (georegionsNS.georegions = []);
    var newGeoregionObj = _.extend({}, newGeoregionData);
    georegionsNS.georegions.push(newGeoregionObj);
    georegionsNS.renderPage();
  };

})();

$(function() {
  var georegionsNS = blist.namespace.fetch('blist.georegions');

  georegionsNS.renderPage();

  $('[data-action="add"]').click(function(event) {
    event.preventDefault();

    if ($(this).hasClass('disabled')) {
      return;
    }

    $('#selectDataset').jqmShow();
  });
});
