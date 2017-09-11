import { PropTypes } from 'react';
import ConnectionsPropType from './ConnectionsPropType';
import ForcedConnectionsPropType from './ForcedConnectionsPropType';
import ModalConfigPropType from './ModalConfigPropType';

// This is what gets passed in to the component, generated in the auth0_helper.rb file
export default
  PropTypes.shape({
    // ID for the "client" in auth0; generally, we have a client for each environment
    auth0ClientId: PropTypes.string.isRequired,

    // Auth0 URI (most likely socrata.auth0.com)
    auth0Uri: PropTypes.string.isRequired,

    // Auth0 "custom database" connection to use for username/password logins
    // In "development" mode (Rails.env.development?) this is not used and instead
    // the login is submitted straight to the user_sessions_controller
    auth0DatabaseConnection: PropTypes.string,

    // Whether or not to submit straight to the user_sessions_controller or to go
    // through the auth0 custom database connection
    allowUsernamePasswordLogin: PropTypes.bool.isRequired,

    // Site key for recaptcha (for signup page)
    recaptchaSitekey: PropTypes.string,

    // URI for the current domain
    baseDomainUri: PropTypes.string.isRequired,

    // Token for rails form
    authenticityToken: PropTypes.string.isRequired,

    // Whether to show social login
    showSocial: PropTypes.bool,

    // Whether or not to hide the "Sign in with Socrata ID" button
    hideSocrataId: PropTypes.bool,

    // Whether to bypass logging in through auth0 with @socrata.com emails
    // (note that this is also enforced in frontend)
    socrataEmailsBypassAuth0: PropTypes.bool,

    // These connections are shown as buttons to login through specific auth0 federated connections
    connections: PropTypes.arrayOf(ConnectionsPropType),

    // Regex strings that can force emails matching certain patterns to go through a specific connection
    forcedConnections: PropTypes.arrayOf(ForcedConnectionsPropType),

    // Message that displays above the "connections"
    // Note that if there are no connections, this message is not shown
    chooseConnectionMessage: PropTypes.string,

    // Message is displayed above the signin form
    // Displays regardless of the presence of "connections"
    formMessage: PropTypes.string,

    // A modal that pops up, covering any forms, that must be accepted before continuing
    modalConfig: ModalConfigPropType,

    // Any flashes to display
    flashes: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),

    // Translations object
    translations: PropTypes.object,

    // Company name to display above login form ("Sign In to ....")
    companyName: PropTypes.string.isRequired,

    // A function that switches between Sign Up and Log In and vice versa when called
    toggleViewMode: PropTypes.func,

    // Any params that come in from the request to load the page; used i.e. to grab the entered userName and emails
    // if the sign up form submission fails (so user doesn't have to re-type them)
    // Note that this is filtered in the auth0_helper so not ALL params are available
    params: PropTypes.object,

    // Whether or not to add "autocomplete=false" to the signin form
    disableSignInAutocomplete: PropTypes.bool,

    // Whether or not we're "linking" a social account.
    // This should only be true after sucessully logging in to a social account via auth0.
    // This changes where the forms submit to to take differen actions, and hides the password fields on the signup page.
    // A message is also shown above signin and signup.
    linkingSocial: PropTypes.bool.isRequired
  });
