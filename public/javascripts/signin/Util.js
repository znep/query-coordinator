/**
 * Currently, anything with an @ followed by text is considered "valid"
 * This is so for SSO (federated) email adresses you can just type @whatever
 * and be sent to the right login system (i.e. just typing "@socrata" will log you
 * in with our login system)
 */
export function isValidEmail(email) {
  return email.match(/@.+$/);
}

/**
 * This finds the first connection in the list of forced connections that matches the given email.
 * If no such forced connection is found, undefined is returned instead.
 */
export function findForcedConnection(email, forcedConnections) {
  return _.find(
    forcedConnections,
    (forcedConnection) => new RegExp(`^${forcedConnection.match}$`).test(email)
  );
}

/**
 * This finds the connection in the list of connections that matches the given email.
 * If no such connection is found, undefined is returned instead.
 */
export function findEmailDomainConnection(email, connections, socrataEmailsBypassAuth0) {
  const emailSplit = email.split('@');

  if (emailSplit.length !== 2) {
    return undefined;
  }

  const emailDomain = emailSplit[1];

  // this option allows users with @socrata.com emails to login directly to rails and
  // bypass auth0; note that this is also enforced in the user_sessions controller
  if (socrataEmailsBypassAuth0 && emailDomain === 'socrata.com') {
    return undefined;
  }

  return _.find(connections, (connection) => {
    const { status, domain_aliases } = connection;
    return status === true && _.includes(domain_aliases, emailDomain);
  });
}

/**
 * Finds a connection either by the email domain or by the configured forced connection regex
 */
export function findForcedOrEmailDomainConnection(
    email,
    auth0Connections,
    forcedConnections,
    socrataEmailsBypassAuth0
  ) {
  const emailDomainconnection =
    findEmailDomainConnection(email, auth0Connections, socrataEmailsBypassAuth0);

  const forcedConnection =
    findForcedConnection(email, forcedConnections);

  // forced connection takes precedence
  if (!_.isUndefined(forcedConnection)) {
    return forcedConnection.connection;
  } else if (!_.isUndefined(emailDomainconnection)) {
    return emailDomainconnection.name;
  }
}
