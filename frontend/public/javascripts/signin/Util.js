import React from 'react';
import Alerts from './components/Alerts';
import _ from 'lodash';

// (yuck! this came from core, don't blame me)
// eslint-disable-next-line max-len
const CORE_EMAIL_REGEX = "[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?";

/**
 * Unless 'strict' is true, anything with an @ followed by text is considered "valid"
 * This is so for SSO (federated) email adresses you can just type @whatever
 * and be sent to the right login system (i.e. just typing "@socrata" will log you
 * in with our login system)
 */
export function isValidEmail(email, strict = false) {
  if (strict === true) {
    return new RegExp(CORE_EMAIL_REGEX, 'i').test(email);
  } else {
    return new RegExp('@.+$', 'i').test(email);
  }
}

/**
 * Returns true if the given email is an attempt to "spoof" a user.
 * That is, it is of the form "user_email@email.com superadmin@socrata.com"
 */
export function isSpoofing(email) {
  if (_.isEmpty(email)) {
    return false;
  }

  const split = email.split(' ');
  return split.length === 2 && isValidEmail(split[0], true) && isValidEmail(split[1], true);
}

/**
 * This finds the first connection in the list of forced connections that matches the given email.
 * If no such forced connection is found, undefined is returned instead.
 */
export function findForcedConnection(email, forcedConnections) {
  return _.find(
    forcedConnections,
    (forcedConnection) => new RegExp(`^${forcedConnection.match}$`, 'i').test(email)
  );
}

/**
 * This finds the connection in the list of connections that matches the given email.
 * If no such connection is found, undefined is returned instead.
 */
export function findEmailDomainConnection(email, connections, socrataEmailsBypassAuth0) {
  const emailSplit = email.split('@');

  if (emailSplit.length !== 2) {
    return null;
  }

  const emailDomain = emailSplit[1];

  // this option allows users with @socrata.com emails to login directly to rails and
  // bypass auth0; note that this is also enforced in the user_sessions controller
  if (socrataEmailsBypassAuth0 && emailDomain === 'socrata.com') {
    return null;
  }

  return _.find(connections, (connection) => {
    const { status, domain_aliases } = connection;
    return status === true && _.includes(domain_aliases, emailDomain);
  });
}

/**
 * Finds a connection either by the email domain or by the configured forced connection regex
 */
export function findConnection(
    email,
    auth0Connections,
    forcedConnections,
    socrataEmailsBypassAuth0
  ) {
  const emailDomainConnection =
    findEmailDomainConnection(email, auth0Connections, socrataEmailsBypassAuth0);

  const forcedConnection =
    findForcedConnection(email, forcedConnections);

  // forced connection takes precedence
  if (!_.isEmpty(forcedConnection)) {
    return forcedConnection.connection;
  } else if (!_.isEmpty(emailDomainConnection)) {
    return emailDomainConnection.name;
  }
}

/**
 * Render all the alerts;
 * Note that the component this is called in *must* be using react-css-modules
 * and *must* have a stylesheet that has all the proper alert levels set.
 */
export function renderAlerts(alerts) {
  if (_.isEmpty(alerts)) {
    return null;
  }

  const messages = alerts.map((flash) => {
    return {
      level: flash[0],
      message: flash[1]
    };
  });

  return (<Alerts alerts={messages} />);
}
