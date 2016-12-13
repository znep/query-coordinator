import { PropTypes } from 'react';
import ConnectionsPropType from './ConnectionsPropType';
import ForcedConnectionsPropType from './ForcedConnectionsPropType';

// This is what gets passed in to the component, generated in the auth0_helper.rb file
export default
  PropTypes.shape({
    // ID for the "client" in auth0; generally, we have a client for each environment
    auth0ClientId: PropTypes.string.isRequired,

    // Auth0 URI (most likely socrata.auth0.com)
    auth0Uri: PropTypes.string.isRequired,

    // URI for the current domain
    baseDomainUri: PropTypes.string.isRequired,

    // Token for rails form
    authenticityToken: PropTypes.string.isRequired,

    // Whether to show the "Remember Me" checkbox
    rememberMe: PropTypes.bool,

    // Whether to show social login
    showSocial: PropTypes.bool,

    // Whether or not to hide the "Sign in with Socrata ID" button
    hideSocrataId: PropTypes.bool,

    // Whether to bypass logging in through auth0 with @socrata.com emails
    // (note that this is still enforced in frontend)
    socrataEmailsBypassAuth0: PropTypes.bool,

    // These connections are shown as buttons to login through specific auth0 federated connections
    connections: PropTypes.arrayOf(ConnectionsPropType),

    forcedConnections: PropTypes.arrayOf(ForcedConnectionsPropType),

    // The message that displays above the "connections"
    // Note that if there are no connections, no message is shown
    chooseConnectionMessage: PropTypes.string,

    // This message is displayed above the signin form
    formMessage: PropTypes.string,

    // Any flashes to display
    flashes: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),

    // Translations object
    translations: PropTypes.object.isRequired,

    // Company name to display above login form ("Sign In to ....")
    companyName: PropTypes.string.isRequired
  });
