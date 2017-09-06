import _ from 'lodash';
import airbrake from 'common/airbrake';
import moment from 'moment-timezone';
import jstz from 'jstz';

/* eslint no-empty: ["error", { "allowEmptyCatch": true }] */

// Expects serverConfig.localePrefix
export const localizeLink = (href) => {
  const config = window.serverConfig;

  if ('localePrefix' in config) {
    return `${config.localePrefix}${href}`;
  }

  console.warn('Expected serverConfig to contain a localePrefix property. Your links will not be localized');

  return href;
};

export const fetchTranslation = (key) => {
  const message = _.get(I18n, key);
  if (!message) {
    console.error(`Error retrieving I18n message for key: ${key}`);
    try {
      airbrake.notify({
        error: `Error retrieving I18n message for key: ${key}`,
        context: { component: 'I81n' }
      });
    } catch (err) {}
  }
  return message;
};

const getLocale = () => _.get(window.blist, 'locale', _.get(window.serverConfig, 'locale', 'en'));

const getTimezone = () => _.get(window.blist, 'configuration.userTimeZoneName', jstz.determine().name());

// If any of this logic changes, please make corresponding changes to:
// frontend/public/javascripts/screens/all-screens.js
// On or about ~L230:$('.dateLocalize').each(function() { ...
// Also formatDateWithLocale in common/dates.js.
export const dateLocalize = (element) => {
  const $dateSpan = $(element);
  const format = $dateSpan.data('format');
  const rawdate = $dateSpan.data('rawdatetime') * 1000;

  $dateSpan.text(moment(rawdate).tz(getTimezone()).locale(getLocale()).format(format));
};
