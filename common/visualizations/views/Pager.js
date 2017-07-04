const _ = require('lodash');
const $ = require('jquery');
const utils = require('common/js_utils');
const I18n = require('common/i18n').default;

// Passing in locale is a temporary workaround to localize the Pager
module.exports = function Pager(element, locale) {
  const self = this;
  let lastRenderOptions;
  let lastButtonFocusedSelector = null;

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
    let message;
    const endIndex = Math.min(options.datasetRowCount, options.endIndex);

    if (options.datasetRowCount === 0) {
      message = I18n.t('shared.visualizations.charts.table.no_rows', locale);
    } else if (options.endIndex === options.startIndex + 1) {
      message = I18n.t('shared.visualizations.charts.table.only_rows', locale);
    } else if (hasOnlyOnePage(options)) {
      message = I18n.t('shared.visualizations.charts.table.all_rows', locale);
    } else if (!_.isFinite(options.datasetRowCount)) {
      message = I18n.t('shared.visualizations.charts.table.no_row_count', locale);
    } else {
      message = I18n.t('shared.visualizations.charts.table.many_rows', locale);
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
    const template = [
      '<span class="pager-buttons">',
        '<button{previousDisabled} class="pager-button-previous"><span class="icon-arrow-left"></span> {previous}</button>',
        '<button{nextDisabled} class="pager-button-next">{next} <span class="icon-arrow-right"></span></button>',
      '</span>'
    ].join('\n');

    return template.format({
      previous: I18n.t('shared.visualizations.charts.table.previous', locale),
      next: I18n.t('shared.visualizations.charts.table.next', locale),
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
    const template = templatePager(options).format({
      'classes': hasOnlyOnePage(options) ? ' socrata-pager-single-page' : ''
    });
    const $template = $(template);

    // Enhancement: Incremental updates (vs. rerender every time).
    self.$element.find('.socrata-pager').remove();

    self.$element.append($template);

    if (lastButtonFocusedSelector) {
      const button = self.$element.find(lastButtonFocusedSelector);

      if (button.attr('disabled') === 'disabled') {
        const otherButtonSelector = lastButtonFocusedSelector === '.pager-button-next' ?
          '.pager-button-previous' :
          '.pager-button-next';
        self.$element.find(otherButtonSelector).focus();
      } else {
        button.focus();
      }

      lastButtonFocusedSelector = null;
    }
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
    lastButtonFocusedSelector = '.pager-button-next';
    emitEvent('SOCRATA_VISUALIZATION_PAGINATION_NEXT');
  }

  function handlePrevious() {
    lastButtonFocusedSelector = '.pager-button-previous';
    emitEvent('SOCRATA_VISUALIZATION_PAGINATION_PREVIOUS');
  }

  function hasOnlyOnePage(options) {
    const atTheStart = options.startIndex === 0;
    const atTheEnd = options.endIndex === options.datasetRowCount;

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
