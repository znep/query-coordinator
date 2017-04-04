import { expect, assert } from 'chai';
import * as Util from 'Util';

describe('Util', () => {
  const forcedConnections = [
    {
      "match": ".*[.][cC][tT][rR]@some-domain[.]gov",
      "connection":"some-domain-CTR"
    },
    {
      "match": ".*@some-domain[.]gov",
      "connection": "some-domain"
    }
  ];

  const auth0Connections = [
    {"name":"socrata-okta-sts","domain":"socrata.com","domain_aliases":["socrata.com"],"strategy":"samlp","status":true},
    {"name":"adfs.somewhere.ca","domain":"somewhere.ca","domain_aliases":["somewhere.ca"],"strategy":"adfs","status":false},
    {"name":"data-somewhere-else","domain":"somewhere-else.gov","domain_aliases":["somewhere-else.gov"],"strategy":"samlp","status":true},
    {"name":"twitter","strategy":"twitter","status":true},
    {"name":"facebook","scope":"email","strategy":"facebook","status":true}
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
      expect(Util.findForcedConnection('cool.guy@some-domain.gov', forcedConnections)).to.equal(forcedConnections[1]);
      expect(Util.findForcedConnection('cool.person.CTR@some-domain.gov', forcedConnections)).to.equal(forcedConnections[0]);
    });

    it('returns nothing if no forced connection is found', () => {
      assert.notOk(Util.findForcedConnection('cool.guy@coolwebsite.com', forcedConnections));
      assert.notOk(Util.findForcedConnection('cool.gal@some-domain.gov.wat', forcedConnections));
      assert.notOk(Util.findForcedConnection('cool.dude@some-domain.gov\n\nwat', forcedConnections));
    });
  });

  describe('findEmailDomainConnection', () => {
    it('finds connection by email domain', () => {
      expect(Util.findEmailDomainConnection('cool.guy@socrata.com', auth0Connections, false)).to.equal(auth0Connections[0]);
      expect(Util.findEmailDomainConnection('cool.gal@somewhere-else.gov', auth0Connections, false)).to.equal(auth0Connections[2]);
    });

    it('returns nothing when email does not match a connection', () => {
      assert.notOk(Util.findEmailDomainConnection('awesome.man@gmail.com', auth0Connections, false));
      assert.notOk(Util.findEmailDomainConnection('not-an-email', auth0Connections, false));
    });

    it('returns nothing for disabled connections', () => {
      assert.notOk(Util.findEmailDomainConnection('awesome.lady@somewhere.ca', auth0Connections, false));
    });

    it('returns nothing for @socrata.com emails when socrataEmailsBypassAuth0 is true', () => {
      assert.notOk(Util.findEmailDomainConnection('cool.guy@socrata.com', auth0Connections, true));
    });
  });

  describe('findConnection', () => {
    it('returns forced email even when connection is present', () => {
      const someConnection = [
        {"name":"some-domain","domain":"some-domain.gov","domain_aliases":["some-domain.gov"],"strategy":"samlp","status":true}
      ];

      const forcedConnection = [
        {
          "match": ".*@some-domain[.]gov",
          "connection": "some-domain"
        }
      ];

      expect(Util.findConnection('spectacular.person@some-domain.gov', someConnection, forcedConnection, false)).to.equal(forcedConnection[0].connection);
    });

    it('returns regular connection if no forced connection is found', () => {
      expect(Util.findConnection('spectacular.dude@socrata.com', auth0Connections, forcedConnections, false)).to.equal('socrata-okta-sts');
    });

    it('returns nothing if no connection is found', () => {
      assert.notOk(Util.findConnection('spectacular.man@gmail.com', auth0Connections, forcedConnections, false));
    });

    it('returns nothing for @socrata.com emails when socrataEmailsBypassAuth0 is true', () => {
      assert.notOk(Util.findConnection('fantastic.dude@socrata.com', auth0Connections, forcedConnections, true));
    });
  });

  describe('translate', () => {
    const translator = new Util.Translate({
      a: {
        very: {
          deep: {
            translation: 'hello'
          }
        }
      },
      translation: {
        with: {
          replacements: "what's up %{name}",
          multiple_replacements: "hey there %{name} you're very %{adjective}"
        }
      }
    });

    it('gets nested translations', () => {
      expect(translator.get('a.very.deep.translation')).to.equal('hello');
    });

    it('replaces strings properly', () => {
      expect(translator.get('translation.with.replacements', { name: 'dude' })).to.equal("what's up dude")
    });

    it('replaces multiple strings properly', () => {
      expect(
        translator.get(
          'translation.with.multiple_replacements',
          { name: 'dudette', adjective: 'cool'}
        )
      ).to.equal("hey there dudette you're very cool")
    });

    it('returns errors', () => {
      expect(translator.get('a.missing.translation')).to.equal('(missing translation: a.missing.translation)')
    });
  });
});
