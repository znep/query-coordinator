var config = require('../../test-config.js');
var socrataTest = require('../../util/SocrataTest.js').socrataTest;
var expect = require('expect.js');
var _ = require('underscore');

describe('Security', function()
{
    var ci = null;
    var t = null;
    before(function(done)
    {
        t = socrataTest(this.test).enableScreenshotOnFailure();
        ci = t.createClient();

        t.goHome();
        done();
    });

    describe('Login', function()
    {
        it('should accept the configured login', function(done)
        {
            ci.socrata.ensureLoggedIn();
            ci.socrata.getCurrentUserEmail().then(function(un)
            {
                expect(un).to.be(config.server.username);
            });
            ci.call(done);
        });

        it('should reject a bad login', function(done)
        {
            ci.socrata.ensureLoggedInAs('baduser', 'badpassword');
            ci.socrata.getCurrentUserEmail().then(function(un)
            {
                expect(un).to.be(null);
            });
            ci.call(done);
        });
    });

    after(function(done)
    {
        t.end(done);
    });
});
