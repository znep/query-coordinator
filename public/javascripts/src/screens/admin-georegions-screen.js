var t = function(str, props) {
  return $.t('screens.admin.georegions.' + str, props);
};

(function() {
  var PropTypes = React.PropTypes;
  var georegionsNS = blist.namespace.fetch('blist.georegions');

  var FormButton = React.createClass({
    propTypes: {
      action: PropTypes.string.isRequired,
      authenticityToken: PropTypes.string.isRequired,
      method: PropTypes.string.isRequired,
      onSubmit: PropTypes.func,
      value: PropTypes.string.isRequired
    },
    handleSubmit: function(event) {
      event.preventDefault();
      if (this.props.onSubmit) {
        this.props.onSubmit();
      }
    },
    render: function() {
      var props = this.props;
      return (
        <form onSubmit={this.handleSubmit} acceptCharset="UTF-8" action={props.action} method="post" style={{display: 'inline'}}>
          <div style={{ margin: 0, padding: 0, display: 'inline' }}>
            <input name="utf8" type="hidden" value="✓" />
            <input name="_method" type="hidden" value={props.method} />
            <input name="authenticity_token" type="hidden" value={props.authenticityToken} />
          </div>
          <input className="button" name="commit" type="submit" value={props.value} />
        </form>
      );
    }
  });

  var EnabledWidget = React.createClass({
    propTypes: {
      action: PropTypes.string.isRequired,
      authenticityToken: PropTypes.string.isRequired,
      isEnabled: PropTypes.bool.isRequired
    },
    render: function() {
      var props = this.props;
      var isEnabledLabel = props.isEnabled ? t('enabled_yes') : t('enabled_no');
      var enabledClassName = props.isEnabled ? 'is-enabled' : 'is-disabled';
      var actionButton;
      if (props.isEnabled) {
        actionButton = (
          <FormButton action={props.action + '/disable'} method="put" authenticityToken={props.authenticityToken} value={t('disable')} />
        );
      } else {
        actionButton = (
          <FormButton action={props.action + '/enable'} method="put" authenticityToken={props.authenticityToken} value={t('enable')} />
        );
      }

      return (
        <div>
          <span className={'enabled-widget-label ' + enabledClassName}>{isEnabledLabel}</span>
          {actionButton}
        </div>
      );
    }
  });

  var Row = React.createClass({
    propTypes: {
      action: PropTypes.string.isRequired,
      authenticityToken: PropTypes.string.isRequired,
      isEnabled: PropTypes.bool.isRequired,
      name: PropTypes.string.isRequired,
      renderActions: PropTypes.bool.isRequired
    },
    render: function() {
      var props = this.props;
      return (
        <tr className="item">
          <td className="name">{props.name}</td>
          <td className="toggle-enabled">
            <EnabledWidget isEnabled={props.isEnabled} action={props.action} authenticityToken={props.authenticityToken} />
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
      authenticityToken: PropTypes.string.isRequired,
      baseUrlPath: PropTypes.string.isRequired,
      renderActions: PropTypes.bool,
      rows: PropTypes.arrayOf(GeoregionPropType).isRequired
    },
    getDefaultProps: function() {
      return {
        renderActions: true,
        rows: []
      };
    },
    renderRows: function(rows) {
      var props = this.props;
      return rows.map(function(row) {
        return (
          <Row
            key={row.id}
            renderActions={props.renderActions}
            action={props.baseUrlPath + row.id}
            name={row.name}
            isEnabled={row.enabledFlag}
            authenticityToken={props.authenticityToken} />
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

  function renderPage() {
    var authenticityToken = $('.georegions-controls-custom [name="authenticity_token"]').value();
    var baseUrlPath = '/admin/geo/';
    var data = georegionsNS.georegions;
    var enabledBoundaries = _.filter(data, _.property('enabledFlag'));
    var [defaultBoundaries, customBoundaries] = _.partition(data, _.property('defaultFlag'));
    React.render(
      <GeoregionAdminTable rows={customBoundaries} baseUrlPath={baseUrlPath} authenticityToken={authenticityToken} />,
      $('.georegions-custom .gridListWrapper').get(0)
    );
    React.render(
      <GeoregionAdminTable rows={defaultBoundaries} renderActions={false} baseUrlPath={baseUrlPath} authenticityToken={authenticityToken} />,
      $('.georegions-default .gridListWrapper').get(0)
    );

    React.render(
      <span>{t('page_subtitle', { enabled_count: enabledBoundaries.length, available_count: georegionsNS.maximumEnabledCount })}</span>,
      $('#georegions-page-subtitle').get(0)
    );
  }

  georegionsNS.renderPage = renderPage;

  georegionsNS.components = {
    GeoregionAdminTable,
    Row,
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
