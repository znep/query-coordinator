const _ = require('lodash');
const $ = require('jquery');
const utils = require('socrata-utils');
const I18n = require('../I18n');

module.exports = function Pager(element) {
  var self = this;
  var lastRenderOptions;

  this.$element = $(element);

  attachEvents();

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
    detachEvents();
    this.$element.find('.socrata-pager').remove();
  };

  /**
   * Private Methods
   */

  function templatePagerLabel(options) {
    var message;
    var endIndex = Math.min(options.datasetRowCount, options.endIndex);

    if (options.datasetRowCount === 0) {
      message = I18n.translate('visualizations.table.no_rows');
    } else if (options.endIndex === options.startIndex + 1) {
      message = I18n.translate('visualizations.table.only_row');
    } else if (hasOnlyOnePage(options)) {
      message = I18n.translate('visualizations.table.all_rows');
    } else if (!_.isFinite(options.datasetRowCount)) {
      message = I18n.translate('visualizations.table.no_row_count');
    } else {
      message = I18n.translate('visualizations.table.many_rows');
    }

    message = message.format({
      unitOne: options.unit.one,
      unitOther: options.unit.other,
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
      previous: I18n.translate('visualizations.table.previous'),
      next: I18n.translate('visualizations.table.next'),
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

    self.
      $element.
        find('.socrata-pager').
          remove(); // Enhancement: Incremental updates (vs. rerender every time).
    self.
      $element.
          append($template);
  }

  function attachEvents() {
    self.$element.on('click', '.pager-buttons .pager-button-previous', handlePrevious);
    self.$element.on('click', '.pager-buttons .pager-button-next', handleNext);
  }

  function detachEvents() {
    self.$element.off('click', '.pager-buttons .pager-button-previous', handlePrevious);
    self.$element.off('click', '.pager-buttons .pager-button-next', handleNext);
  }

  function handleNext() {
    emitEvent('SOCRATA_VISUALIZATION_PAGINATION_NEXT');
  }

  function handlePrevious() {
    emitEvent('SOCRATA_VISUALIZATION_PAGINATION_PREVIOUS');
  }

  function hasOnlyOnePage(options) {
    var atTheStart = options.startIndex === 0;
    var atTheEnd = options.endIndex === options.datasetRowCount;

    return atTheStart && atTheEnd;
  }

  function emitEvent(name, payload) {

    self.$element[0].dispatchEvent(
      new window.CustomEvent(
        name,
        { detail: payload, bubbles: true }
      )
    );
  }
};
