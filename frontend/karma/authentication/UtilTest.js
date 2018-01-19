import { assert } from 'chai';
import * as Util from 'authentication/Util';

describe('Util', () => {
  const forcedConnections = [
    {
      match: '.*[.][c][t][r]@some-domain[.]gov',
      connection: 'some-domain-CTR'
    },
    {
      match: '.*@some-domain[.]gov',
      connection: 'some-domain'
    }
  ];

  const auth0Connections = [
    {
      name: 'socrata-okta-sts',
      domain: 'socrata.com',
      domain_aliases: ['socrata.com'],
      strategy: 'samlp',
      status: true
    },
    {
      name: 'adfs.somewhere.ca',
      domain: 'somewhere.ca',
      domain_aliases: ['somewhere.ca'],
      strategy: 'adfs',
      status: false
    },
    {
      name: 'data-somewhere-else',
      domain: 'somewhere-else.gov',
      domain_aliases: ['somewhere-else.gov'],
      strategy: 'samlp',
      status: true
    },
    {
      name: 'twitter',
      strategy: 'twitter',
      status: true},
    {
      name: 'facebook',
      scope: 'email',
      strategy: 'facebook',
      status: true
    }
  ];

  describe('isValidEmail', () => {
    it('allows valid emails', () => {
      assert.isTrue(Util.isValidEmail('cool.guy@coolwebsite.com'));
    });

    it("doesn't allow invalid emails", () => {
      assert.isFalse(Util.isValidEmail('not-an-email'));
    });

    it("doesn't allow multi-line emails", () => {
      assert.isFalse(Util.isValidEmail('cool.guy@coolwebsite.com\n\nmore-not-emails'));
    });

    it('allows just @domain', () => {
      assert.isTrue(Util.isValidEmail('@coolwebsite.com'));
    });
  });

  describe('findForcedConnection', () => {
    it('finds forced connections', () => {
      assert.equal(Util.findForcedConnection('cool.guy@some-domain.gov', forcedConnections), forcedConnections[1]);
      assert.equal(Util.findForcedConnection('cool.person.CTR@some-domain.gov', forcedConnections), forcedConnections[0]);
      assert.equal(Util.findForcedConnection('cool.person.ctr@some-domain.gov', forcedConnections), forcedConnections[0]);
      assert.equal(Util.findForcedConnection('cool.person.CtR@some-domain.gov', forcedConnections), forcedConnections[0]);
    });

    it('returns nothing if no forced connection is found', () => {
      assert.isNotOk(Util.findForcedConnection('cool.guy@coolwebsite.com', forcedConnections));
      assert.isNotOk(Util.findForcedConnection('cool.gal@some-domain.gov.wat', forcedConnections));
      assert.isNotOk(Util.findForcedConnection('cool.dude@some-domain.gov\n\nwat', forcedConnections));
    });
  });

  describe('findEmailDomainConnection', () => {
    it('finds connection by email domain', () => {
      assert.equal(Util.findEmailDomainConnection('cool.guy@socrata.com', auth0Connections, false), auth0Connections[0]);
      assert.equal(Util.findEmailDomainConnection('cool.gal@somewhere-else.gov', auth0Connections, false), auth0Connections[2]);
    });

    it('returns nothing when email does not match a connection', () => {
      assert.isNotOk(Util.findEmailDomainConnection('awesome.man@gmail.com', auth0Connections, false));
      assert.isNotOk(Util.findEmailDomainConnection('not-an-email', auth0Connections, false));
    });

    it('returns nothing for disabled connections', () => {
      assert.isNotOk(Util.findEmailDomainConnection('awesome.lady@somewhere.ca', auth0Connections, false));
    });

    it('returns nothing for @socrata.com emails when socrataEmailsBypassAuth0 is true', () => {
      assert.isNotOk(Util.findEmailDomainConnection('cool.guy@socrata.com', auth0Connections, true));
    });
  });

  describe('findConnection', () => {
    it('returns forced email even when connection is present', () => {
      const someConnection = [
        {
          name: 'some-domain',
          domain: 'some-domain.gov',
          domain_aliases: ['some-domain.gov'],
          strategy: 'samlp',
          status: true
        }
      ];

      const forcedConnection = [
        {
          match: '.*@some-domain[.]gov',
          connection: 'some-domain'
        }
      ];

      assert.equal(Util.findConnection('spectacular.person@some-domain.gov', someConnection, forcedConnection, false), forcedConnection[0].connection);
    });

    it('returns regular connection if no forced connection is found', () => {
      assert.equal(Util.findConnection('spectacular.dude@socrata.com', auth0Connections, forcedConnections, false), 'socrata-okta-sts');
    });

    it('returns nothing if no connection is found', () => {
      assert.isNotOk(Util.findConnection('spectacular.man@gmail.com', auth0Connections, forcedConnections, false));
    });

    it('returns nothing for @socrata.com emails when socrataEmailsBypassAuth0 is true', () => {
      assert.isNotOk(Util.findConnection('fantastic.dude@socrata.com', auth0Connections, forcedConnections, true));
    });
  });

  describe('isSpoofing', () => {
    it('returns true for spoofed emails', () => {
      assert.isTrue(Util.isSpoofing('user@email.com superadmin@socrata.com'));
    });

    it('returns false for regular emails', () => {
      assert.isFalse(Util.isSpoofing('user@email.com'));
    });

    it('returns false if either email is not valid', () => {
      assert.isFalse(Util.isSpoofing('not-valid superadmin@socrata.com'));
      assert.isFalse(Util.isSpoofing('user@email.com not-valid'));
    });

    it('returns false for null and undefined', () => {
      assert.isFalse(Util.isSpoofing(null));
      assert.isFalse(Util.isSpoofing(undefined));
    });

    it('returns false for empty string', () => {
      assert.isFalse(Util.isSpoofing(''));
    });
  });
});
