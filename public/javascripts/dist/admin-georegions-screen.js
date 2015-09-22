'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var t = function t(str, props) {
  return $.t('screens.admin.georegions.' + str, props);
};

(function () {
  var PropTypes = React.PropTypes;
  var georegionsNS = blist.namespace.fetch('blist.georegions');

  var FormButton = React.createClass({
    displayName: 'FormButton',

    propTypes: {
      action: PropTypes.string.isRequired,
      authenticityToken: PropTypes.string.isRequired,
      method: PropTypes.string.isRequired,
      onSubmit: PropTypes.func,
      value: PropTypes.string.isRequired
    },
    handleSubmit: function handleSubmit(event) {
      event.preventDefault();
      if (this.props.onSubmit) {
        this.props.onSubmit();
      }
    },
    render: function render() {
      var props = this.props;
      return React.createElement(
        'form',
        { onSubmit: this.handleSubmit, acceptCharset: 'UTF-8', action: props.action, method: 'post', style: { display: 'inline' } },
        React.createElement(
          'div',
          { style: { margin: 0, padding: 0, display: 'inline' } },
          React.createElement('input', { name: 'utf8', type: 'hidden', value: '✓' }),
          React.createElement('input', { name: '_method', type: 'hidden', value: props.method }),
          React.createElement('input', { name: 'authenticity_token', type: 'hidden', value: props.authenticityToken })
        ),
        React.createElement('input', { className: 'button', name: 'commit', type: 'submit', value: props.value })
      );
    }
  });

  var EnabledWidget = React.createClass({
    displayName: 'EnabledWidget',

    propTypes: {
      action: PropTypes.string.isRequired,
      authenticityToken: PropTypes.string.isRequired,
      isEnabled: PropTypes.bool.isRequired
    },
    render: function render() {
      var props = this.props;
      var isEnabledLabel = props.isEnabled ? t('enabled_yes') : t('enabled_no');
      var enabledClassName = props.isEnabled ? 'is-enabled' : 'is-disabled';
      var actionButton;
      if (props.isEnabled) {
        actionButton = React.createElement(FormButton, { action: props.action + '/disable', method: 'put', authenticityToken: props.authenticityToken, value: t('disable') });
      } else {
        actionButton = React.createElement(FormButton, { action: props.action + '/enable', method: 'put', authenticityToken: props.authenticityToken, value: t('enable') });
      }

      return React.createElement(
        'div',
        null,
        React.createElement(
          'span',
          { className: 'enabled-state ' + enabledClassName },
          isEnabledLabel
        ),
        actionButton
      );
    }
  });

  var Row = React.createClass({
    displayName: 'Row',

    propTypes: {
      action: PropTypes.string.isRequired,
      authenticityToken: PropTypes.string.isRequired,
      isEnabled: PropTypes.bool.isRequired,
      name: PropTypes.string.isRequired,
      renderActions: PropTypes.bool.isRequired
    },
    render: function render() {
      var props = this.props;
      return React.createElement(
        'tr',
        { className: 'item' },
        React.createElement(
          'td',
          { className: 'name' },
          props.name
        ),
        React.createElement(
          'td',
          { className: 'toggle-enabled' },
          React.createElement(EnabledWidget, { isEnabled: props.isEnabled, action: props.action, authenticityToken: props.authenticityToken })
        ),
        props.renderActions ? React.createElement(
          'td',
          { className: 'edit-action' },
          React.createElement(FormButton, { action: props.action, method: 'put', authenticityToken: props.authenticityToken, value: 'Edit' })
        ) : null,
        props.renderActions ? React.createElement(
          'td',
          { className: 'remove-action' },
          React.createElement(FormButton, { action: props.action, method: 'delete', authenticityToken: props.authenticityToken, value: 'Remove' })
        ) : null
      );
    }
  });

  var GeoregionPropType = PropTypes.shape({
    enabledFlag: PropTypes.bool.isRequired,
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired
  });

  var GeoregionAdminTable = React.createClass({
    displayName: 'GeoregionAdminTable',

    propTypes: {
      authenticityToken: PropTypes.string.isRequired,
      baseUrlPath: PropTypes.string.isRequired,
      renderActions: PropTypes.bool,
      rows: PropTypes.arrayOf(GeoregionPropType).isRequired
    },
    getDefaultProps: function getDefaultProps() {
      return {
        renderActions: true,
        rows: []
      };
    },
    renderRows: function renderRows(rows) {
      var props = this.props;
      return rows.map(function (row) {
        return React.createElement(Row, {
          key: row.id,
          renderActions: props.renderActions,
          action: props.baseUrlPath + row.id,
          name: row.name,
          isEnabled: row.enabledFlag,
          authenticityToken: props.authenticityToken });
      });
    },
    render: function render() {
      var props = this.props;
      return React.createElement(
        'table',
        { className: 'gridList georegions-table', cellSpacing: '0' },
        React.createElement(
          'colgroup',
          null,
          React.createElement('col', { className: 'name' }),
          React.createElement('col', { className: 'toggle-enabled' }),
          props.renderActions ? React.createElement('col', { className: 'edit-action' }) : null,
          props.renderActions ? React.createElement('col', { className: 'remove-action' }) : null,
          React.createElement('col', { className: 'edit-action' }),
          React.createElement('col', { className: 'remove-action' })
        ),
        React.createElement(
          'thead',
          null,
          React.createElement(
            'tr',
            null,
            React.createElement(
              'th',
              { className: 'name' },
              React.createElement(
                'div',
                null,
                t('region_name')
              ),
              React.createElement('span', { className: 'icon' })
            ),
            React.createElement(
              'th',
              { className: 'toggle-enabled' },
              React.createElement(
                'div',
                null,
                t('enabled?')
              ),
              React.createElement('span', { className: 'icon' })
            ),
            props.renderActions ? React.createElement(
              'th',
              { className: 'edit-action' },
              React.createElement(
                'div',
                null,
                t('actions')
              ),
              React.createElement('span', { className: 'icon' })
            ) : null,
            props.renderActions ? React.createElement('th', { className: 'remove-action' }) : null
          )
        ),
        React.createElement(
          'tbody',
          null,
          this.renderRows(props.rows, props.authenticityToken)
        )
      );
    }
  });

  function renderPage() {
    var authenticityToken = $('.georegions-controls-custom [name="authenticity_token"]').value();
    var baseUrlPath = '/admin/geo/';
    var data = georegionsNS.georegions;
    var enabledBoundaries = _.filter(data, _.property('enabledFlag'));

    var _$partition = _.partition(data, _.property('defaultFlag'));

    var _$partition2 = _slicedToArray(_$partition, 2);

    var defaultBoundaries = _$partition2[0];
    var customBoundaries = _$partition2[1];

    React.render(React.createElement(GeoregionAdminTable, { rows: customBoundaries, baseUrlPath: baseUrlPath, authenticityToken: authenticityToken }), $('.georegions-custom .gridListWrapper').get(0));
    React.render(React.createElement(GeoregionAdminTable, { rows: defaultBoundaries, renderActions: false, baseUrlPath: baseUrlPath, authenticityToken: authenticityToken }), $('.georegions-default .gridListWrapper').get(0));

    React.render(React.createElement(
      'span',
      null,
      t('page_subtitle', { enabled_count: enabledBoundaries.length, available_count: georegionsNS.maximumEnabledCount })
    ), $('#georegions-page-subtitle').get(0));
  }

  georegionsNS.renderPage = renderPage;

  georegionsNS.components = {
    GeoregionAdminTable: GeoregionAdminTable,
    Row: Row,
    FormButton: FormButton,
    EnabledWidget: EnabledWidget
  };

  var commonNS = blist.namespace.fetch('blist.common');

  commonNS.georegionSelected = function (newGeoregionData) {
    $('#selectDataset').jqmHide();
    georegionsNS.georegions || (georegionsNS.georegions = []);
    var newGeoregionObj = _.extend({}, newGeoregionData);
    georegionsNS.georegions.push(newGeoregionObj);
    georegionsNS.renderPage();
  };
})();

$(function () {
  var georegionsNS = blist.namespace.fetch('blist.georegions');

  georegionsNS.renderPage();

  $('[data-action="add"]').click(function (event) {
    event.preventDefault();

    if ($(this).hasClass('disabled')) {
      return;
    }

    $('#selectDataset').jqmShow();
  });
});