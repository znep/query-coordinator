var $ = require('jquery');
var utils = require('socrata-utils');
var Visualization = require('./Visualization.js');
var renderNumberCell = require('./DataTypeFormatter.js').renderNumberCell;
var _ = require('lodash');

module.exports = function Pager(element, vif) {
  _.extend(this, new Visualization(element, vif));

  var self = this;
  var _lastRenderOptions;

  utils.assertHasProperties(vif,
    'configuration.localization.PREVIOUS',
    'configuration.localization.NEXT',
    'configuration.localization.NO_ROWS',
    'configuration.localization.ONLY_ROW',
    'configuration.localization.MANY_ROWS',
    'unit.one',
    'unit.other'
  );

  _attachEvents(this.element);

  /**
   * Public Methods
   */

  this.render = function(options) {
    if (_.isEqual(options, _lastRenderOptions)) {
      return;
    }

    _lastRenderOptions = options;

    _render(options);
  };

  this.destroy = function() {
    _detachEvents(this.element);
    this.element.find('.socrata-pager').remove();
  };

  /**
   * Private Methods
   */

  function _templatePagerLabel(options) {
    var message;
    var endIndex = Math.min(options.datasetRowCount, options.endIndex);

    if (options.datasetRowCount === 0) {
      message = vif.configuration.localization.NO_ROWS;
    } else if (options.endIndex === options.startIndex + 1) {
      message = vif.configuration.localization.ONLY_ROW;
    } else {
      message = vif.configuration.localization.MANY_ROWS;
    }

    message = message.format({
      unitOne: vif.unit.one,
      unitOther: vif.unit.other,
      firstRowOrdinal: options.datasetRowCount ? utils.commaify(options.startIndex + 1) : undefined,
      lastRowOrdinal: options.datasetRowCount ? utils.commaify(endIndex) : undefined,
      datasetRowCount: utils.commaify(options.datasetRowCount)
    });

    return '<span class="pager-label">{0}</span>'.format(message);
  }

  function _templatePagerButtons(options) {
    var template = [
      '<span class="pager-buttons">',
        '<button{previousDisabled} class="pager-button-previous"><span class="icon-arrow-left"></span> {previous}</button>',
        '<button{nextDisabled} class="pager-button-next">{next} <span class="icon-arrow-right"></span></button>',
      '</span>'
    ].join('\n');

    return template.format({
      previous: vif.configuration.localization.PREVIOUS,
      next: vif.configuration.localization.NEXT,
      previousDisabled: (options.disabled || options.startIndex === 0) ? ' disabled' : '',
      nextDisabled: (options.disabled || options.endIndex >= options.datasetRowCount - 1) ? ' disabled' : ''
    });
  }

  function _templatePager(options) {
    return [
      '<div class="socrata-pager">',
        _templatePagerButtons(options),
        _templatePagerLabel(options),
      '</div>'
    ].join('\n');
  }

  function _render(options) {
    var $template = $(_templatePager(options));
    self.element.find('.socrata-pager').remove(); // Enhancement: Incremental updates (vs. rerender every time).
    self.element.append($template);
  }

  function _attachEvents(element) {
    self.element.on('click', '.pager-buttons .pager-button-previous', _handlePrevious);
    self.element.on('click', '.pager-buttons .pager-button-next', _handleNext);
  }

  function _detachEvents(element) {
    self.element.off('click', '.pager-buttons .pager-button-previous', _handlePrevious);
    self.element.off('click', '.pager-buttons .pager-button-next', _handleNext);
  }

  function _handleNext() {
    self.emitEvent('SOCRATA_VISUALIZATION_PAGINATION_NEXT');
  }

  function _handlePrevious() {
    self.emitEvent('SOCRATA_VISUALIZATION_PAGINATION_PREVIOUS');
  }
};
