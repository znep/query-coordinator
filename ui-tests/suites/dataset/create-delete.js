var config = require('../../test-config.js');
var socrataTest = require('../../util/SocrataTest.js').socrataTest;
var expect = require('expect.js');
var _ = require('underscore');

describe('dataset', function()
{
    describe('non-existing datasets', function()
    {
        var t = null;
        var ci = null;
        before(function(done)
        {
            t = socrataTest(this.test);
            ci = t.createClient();
            done();
        });

        it('should not be accessible via API', function(done)
        {
            ci.socrata.ensureLoggedIn().then(function()
            {
                ci.socrata.dataset.fromExisting('0000-0000').then(function(dataset)
                {
                    expect(dataset).to.be(null);
                    ci.call(done);
                });
            });
        });

        after(function(done)
        {
            t.end(done);
        });
    });

    describe('creation', function()
    {
        var t = null;
        var ci = null;
        before(function(done)
        {
            t = socrataTest(this.test);
            ci = t.createClient();

            done();
        });

        it('should be possible', function(done)
        {
            ci.socrata.ensureLoggedIn().then(function()
            {
                var templates = ci.socrata.dataset.availableTemplates();
                ci.socrata.dataset.newFromTemplate(templates.NameAndAge).then(function(dataset)
                {
                    expect(dataset).to.not.be(null);
                    dataset.exists().then(function(exists)
                    {
                        expect(exists).to.be(true);
                        ci.call(done);
                    });
                });
            });
        });

        after(function(done)
        {
            t.end(done);
            t = null;
        });

    });
});
