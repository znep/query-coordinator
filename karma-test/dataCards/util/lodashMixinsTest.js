(function() {

  'use strict';

  describe('lo-dash mixins', function() {

    var testObject = {
      foo: {
        bar: {
          baz: 'test value'
        }
      }
    };

    describe('isPresent', function() {

      it('should return true for "present" values', function() {
        expect(_.isPresent('string')).to.equal(true);
        expect(_.isPresent(1)).to.equal(true);
        expect(_.isPresent(['one'])).to.equal(true);
        expect(_.isPresent({ foo: 'bar' })).to.equal(true);
        expect(_.isPresent(true)).to.equal(true);
        expect(_.isPresent(false)).to.equal(true);
      });

      it('should return false for non-present values', function() {
        expect(_.isPresent('')).to.equal(false);
        expect(_.isPresent(0)).to.equal(false);
        expect(_.isPresent([])).to.equal(false);
        expect(_.isPresent(null)).to.equal(false);
        expect(_.isPresent(undefined)).to.equal(false);
        expect(_.isPresent(NaN)).to.equal(false);
      });

    });

    describe('getPathOrElse', function() {
      it('should return the value if the object path exists', function() {
        expect(_.getPathOrElse(testObject, 'foo.bar.baz')).to.equal('test value');
        expect(_.getPathOrElse(testObject, 'foo.bar')).to.eql({ baz: 'test value' });
      });

      it('should return the "else" argument if the object path does not exist', function() {
        expect(_.getPathOrElse(testObject, 'foo.bar.blah', 'else case')).to.equal('else case');
        expect(_.getPathOrElse({}, 'foo.bar', 'else case')).to.equal('else case');
      });

      it('should return undefined if the object path does not exist and there is no "else" argument', function() {
        expect(_.getPathOrElse(testObject, 'foo.bar.blah')).to.be.undefined;
      });

    });

    describe('isPathDefined', function() {

      it('should return true if the object path exists', function() {
        expect(_.isPathDefined(testObject, 'foo')).to.be.true;
        expect(_.isPathDefined(testObject, 'foo.bar')).to.be.true;
        expect(_.isPathDefined(testObject, 'foo.bar.baz')).to.be.true;
      });

      it('should return false if the object path does not exist', function() {
        expect(_.isPathDefined(testObject, 'far')).to.be.false;
        expect(_.isPathDefined(testObject, 'foo.baz')).to.be.false;
        expect(_.isPathDefined(testObject, '')).to.be.false;
      })

    });

    describe('deferred', function() {
      it('returns a function that, when called, calls the parameter in a _.defer', function() {
        var theFunction = function() {};
        var passedInF = null;

        try {
          sinon.stub(_, 'defer', function(f) {
            passedInF = f;
          });

          var deferredFunction = _.deferred(theFunction);

          expect(passedInF).to.equal(null);
          deferredFunction();
          expect(passedInF).to.equal(theFunction);

        } finally {
          _.defer.restore();
        }
      });
    });

    describe('negate', function() {
      it('negates the parameter', function() {
        expect(_.negate(true)).to.equal(false);
        expect(_.negate(false)).to.equal(true);
        expect(_.negate(null)).to.equal(true);
        expect(_.negate(246)).to.equal(false);
      });
    });

    describe('trim', function() {
      it('should exist', function() {
        expect(_).to.respondTo('trim');
      });

      it('should trim whitespace by default', function() {
        expect(_.trim('something')).to.equal('something');
        expect(_.trim(' something ')).to.equal('something');
        expect(_.trim('\tsomething ')).to.equal('something');
        expect(_.trim('something\t')).to.equal('something');
      });

      it('should trim specified character', function() {
        expect(_.trim('"something', '"')).to.equal('something');
        expect(_.trim('something"', '"')).to.equal('something');
        expect(_.trim('"something"', '"')).to.equal('something');
      });
    });
  });

})();
