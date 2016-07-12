var _ = require('lodash');
var $ = require('jquery');
var utils = require('socrata-utils');
var Visualization = require('./Visualization.js');

module.exports = function Pager(element, vif) {
  _.extend(this, new Visualization(element, vif));

  var self = this;
  var lastRenderOptions;

  utils.assertHasProperties(vif,
    'configuration.localization.previous',
    'configuration.localization.next',
    'configuration.localization.no_rows',
    'configuration.localization.only_row',
    'configuration.localization.many_rows',
    'configuration.localization.all_rows',
    'unit.one',
    'unit.other'
  );

  attachEvents(this.element);

  /**
   * Public Methods
   */

  this.render = function(options) {
    if (_.isEqual(options, lastRenderOptions)) {
      return;
    }

    lastRenderOptions = options;

    render(options);
  };

  this.destroy = function() {
    detachEvents(this.element);
    this.element.find('.socrata-pager').remove();
  };

  /**
   * Private Methods
   */

  function templatePagerLabel(options) {
    var message;
    var endIndex = Math.min(options.datasetRowCount, options.endIndex);

    if (options.datasetRowCount === 0) {
      message = vif.configuration.localization.no_rows;
    } else if (options.endIndex === options.startIndex + 1) {
      message = vif.configuration.localization.only_row;
    } else if (hasOnlyOnePage(options)) {
      message = vif.configuration.localization.all_rows;
    } else {
      message = vif.configuration.localization.many_rows;
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

  function templatePagerButtons(options) {
    var template = [
      '<span class="pager-buttons">',
        '<button{previousDisabled} class="pager-button-previous"><span class="icon-arrow-left"></span> {previous}</button>',
        '<button{nextDisabled} class="pager-button-next">{next} <span class="icon-arrow-right"></span></button>',
      '</span>'
    ].join('\n');

    return template.format({
      previous: vif.configuration.localization.previous,
      next: vif.configuration.localization.next,
      previousDisabled: (options.disabled || options.startIndex === 0) ? ' disabled' : '',
      nextDisabled: (options.disabled || options.endIndex >= options.datasetRowCount) ? ' disabled' : ''
    });
  }

  function templatePager(options) {
    return [
      '<div class="socrata-pager{classes}">',
        templatePagerButtons(options),
        templatePagerLabel(options),
      '</div>'
    ].join('\n');
  }

  function render(options) {
    var template = templatePager(options).format({
      'classes': hasOnlyOnePage(options) ? ' socrata-pager-single-page' : ''
    });

    var $template = $(template);
    self.element.find('.socrata-pager').remove(); // Enhancement: Incremental updates (vs. rerender every time).
    self.element.append($template);
  }

  function attachEvents() {
    self.element.on('click', '.pager-buttons .pager-button-previous', handlePrevious);
    self.element.on('click', '.pager-buttons .pager-button-next', handleNext);
  }

  function detachEvents() {
    self.element.off('click', '.pager-buttons .pager-button-previous', handlePrevious);
    self.element.off('click', '.pager-buttons .pager-button-next', handleNext);
  }

  function handleNext() {
    self.emitEvent('SOCRATA_VISUALIZATION_PAGINATION_NEXT');
  }

  function handlePrevious() {
    self.emitEvent('SOCRATA_VISUALIZATION_PAGINATION_PREVIOUS');
  }

  function hasOnlyOnePage(options) {
    var atTheStart = options.startIndex === 0;
    var atTheEnd = options.endIndex === options.datasetRowCount;

    return atTheStart && atTheEnd;
  }
};
