var config = require('../../test-config.js');
var expect = require('expect.js');
var socrataTest = require('../../util/SocrataTest.js').socrataTest;
var _ = require('underscore');

describe('', function()
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

    describe('Basic site sanity checks', function()
    {
        it('should have a title', function(done)
        {
            ci.getTitle().
            then(function(title)
                {
                    expect(title).to.not.be.empty();
                });
            ci.call(done);
        });

        it('should have a blist global object', function(done)
        {
            ci.executeScript("return typeof window.blist;").then(function(retval)
                {
                    expect(retval).to.not.be('undefined');
                });
            ci.call(done);
        });
    });

    after(function(done)
    {
        t.end(done);
    });
});
