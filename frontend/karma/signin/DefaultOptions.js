import translations from 'mockTranslations';

/** This should be the most basic options for the component, to render it as simple as possible */
export default {
  auth0ClientId: "not-a-client",
  auth0Uri:"socrata.auth0.com",
  baseDomainUri:"https://opendata-demo.rc-socrata.com",
  authenticityToken:"not-a-token",
  rememberMe: null,
  showSocial: null,
  hideSocrataId: false,
  socrataEmailsBypassAuth0: false,
  connections: null,
  forcedConnections: null,
  chooseConnectionMessage:"There are several ways you can sign in.",
  formMessage: null,
  flashes: [],
  companyName: 'Testcrata',
  translations
};