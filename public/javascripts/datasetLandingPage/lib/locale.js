// Expects serverConfig.localePrefix
function localizeLink(href) {
  var config = window.serverConfig;

  if ('localePrefix' in config) {
    return `${config.localePrefix}${href}`;
  } else {
    console.warn('Expected serverConfig to contain a localePrefix property. ' +
      'Your links will not be localized');
    return href;
  }
}

export { localizeLink };
