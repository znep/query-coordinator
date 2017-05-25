import airbrake from 'common/airbrake';
import moment from 'moment';

/* eslint no-empty: ["error", { "allowEmptyCatch": true }] */

// Expects serverConfig.localePrefix
export const localizeLink = (href) => {
  const config = window.serverConfig;

  if ('localePrefix' in config) {
    return `${config.localePrefix}${href}`;
  } else {
    console.warn('Expected serverConfig to contain a localePrefix property. ' +
      'Your links will not be localized');
    return href;
  }
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

export const dateLocalize = (element) => {
  const $dateSpan = $(element);
  const format = $dateSpan.data('format');
  const rawdate = $dateSpan.data('rawdatetime') * 1000;
  $dateSpan.text(moment(rawdate).locale(serverConfig.locale).format(format));
};
