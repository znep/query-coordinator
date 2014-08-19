describe("SoqlHelpers service", function() {
  beforeEach(module('dataCards'));

  describe('SOQL string encoder', function() {
    it('should pass through characters other than single quotes', inject(function(SoqlHelpers) {
      expect(SoqlHelpers.encodeSoqlString('')).to.equal("''");
      expect(SoqlHelpers.encodeSoqlString('Foo')).to.equal("'Foo'");
      expect(SoqlHelpers.encodeSoqlString('foo\\a')).to.equal("'foo\\a'");
      expect(SoqlHelpers.encodeSoqlString("foo\nbar")).to.equal("'foo\nbar'");
    }));
    it('should escape single quotes by doubling them', inject(function(SoqlHelpers) {
      expect(SoqlHelpers.encodeSoqlString("'")).to.equal("''''");
      expect(SoqlHelpers.encodeSoqlString("SOQL's escaping is 'ella confusin'")).to.equal("'SOQL''s escaping is ''ella confusin'''");
    }));
    it('should throw errors on non-strings or non-dates', inject(function(SoqlHelpers) {
      expect(function() { SoqlHelpers.encodeSoqlString(undefined); }).to.throw();
      expect(function() { SoqlHelpers.encodeSoqlString(null); }).to.throw();
      expect(function() { SoqlHelpers.encodeSoqlString(0); }).to.throw();
      expect(function() { SoqlHelpers.encodeSoqlString(1); }).to.throw();
      expect(function() { SoqlHelpers.encodeSoqlString([]); }).to.throw();
      expect(function() { SoqlHelpers.encodeSoqlString(['']); }).to.throw();
      expect(function() { SoqlHelpers.encodeSoqlString({}); }).to.throw();
      expect(function() { SoqlHelpers.encodeSoqlString({a:2}); }).to.throw();
    }));
    it('should encode dates to strings', inject(function(SoqlHelpers) {
      expect(SoqlHelpers.encodeSoqlDate(moment('2014-08-01T16:36:24'))).to.equal("'2014-08-01T16:36:24'");
    }));
  });

  describe('SOQL primitive encoder', function() {
    it('should delegate to encodeSoqlString for strings', inject(function(SoqlHelpers) {
      var fakeReturnValue = 'a_special_value';
      var mockedEncode = sinon.stub(SoqlHelpers, 'encodeSoqlString').returns(fakeReturnValue);

      var testPrimitives = [
        '',
        'non_empty'
      ];

      var returned = _.map(testPrimitives, SoqlHelpers.encodePrimitive);

      expect(mockedEncode.callCount).to.equal(testPrimitives.length);
      expect(returned).to.deep.equal(_.times(testPrimitives.length, _.constant(fakeReturnValue))); // Verify passthrough.
      expect(_.flatten(mockedEncode.args)).to.deep.equal(testPrimitives); // Verify passed arguments.

      SoqlHelpers.encodeSoqlString.restore();
    }));

    it('should delegate to encodeSoqlDate for dates', inject(function(SoqlHelpers) {
      var fakeReturnValue = 'a_special_value';
      var mockedEncode = sinon.stub(SoqlHelpers, 'encodeSoqlDate').returns(fakeReturnValue);

      var testPrimitives = [
        moment(),
        moment('2014-08-01T16:36:24'),
        new Date()
      ];

      var returned = _.map(testPrimitives, SoqlHelpers.encodePrimitive);

      expect(mockedEncode.callCount).to.equal(testPrimitives.length);
      expect(returned).to.deep.equal(_.times(testPrimitives.length, _.constant(fakeReturnValue))); // Verify passthrough.
      expect(_.flatten(mockedEncode.args)).to.deep.equal(testPrimitives); // Verify passed arguments.

      SoqlHelpers.encodeSoqlDate.restore();
    }));

    it('should throw errors on unsupported types', inject(function(SoqlHelpers) {
      expect(function() { SoqlHelpers.encodePrimitive(undefined); }).to.throw();
      expect(function() { SoqlHelpers.encodePrimitive(null); }).to.throw();
      expect(function() { SoqlHelpers.encodePrimitive(0); }).to.throw();
      expect(function() { SoqlHelpers.encodePrimitive(1); }).to.throw();
      expect(function() { SoqlHelpers.encodePrimitive([]); }).to.throw();
      expect(function() { SoqlHelpers.encodePrimitive(['']); }).to.throw();
      expect(function() { SoqlHelpers.encodePrimitive({}); }).to.throw();
      expect(function() { SoqlHelpers.encodePrimitive({a:2}); }).to.throw();
    }));

  });

  describe('replaceHyphensWithUnderscores', function() {
    it('should throw on non-strings', inject(function(SoqlHelpers) {
      expect(function() { SoqlHelpers.replaceHyphensWithUnderscores(); }).to.throw();
      expect(function() { SoqlHelpers.replaceHyphensWithUnderscores(1); }).to.throw();
      expect(function() { SoqlHelpers.replaceHyphensWithUnderscores(0); }).to.throw();
      expect(function() { SoqlHelpers.replaceHyphensWithUnderscores(null); }).to.throw();
      expect(function() { SoqlHelpers.replaceHyphensWithUnderscores(undefined); }).to.throw();
      expect(function() { SoqlHelpers.replaceHyphensWithUnderscores({}); }).to.throw();
      expect(function() { SoqlHelpers.replaceHyphensWithUnderscores([]); }).to.throw();
    }));
    it('replace hyphens with underscores', inject(function(SoqlHelpers) {
      expect(SoqlHelpers.replaceHyphensWithUnderscores('')).to.equal('');
      expect(SoqlHelpers.replaceHyphensWithUnderscores('_')).to.equal('_');
      expect(SoqlHelpers.replaceHyphensWithUnderscores('-')).to.equal('_');
      expect(SoqlHelpers.replaceHyphensWithUnderscores('a')).to.equal('a');
      expect(SoqlHelpers.replaceHyphensWithUnderscores('asdf')).to.equal('asdf');
      expect(SoqlHelpers.replaceHyphensWithUnderscores('---')).to.equal('___');
      expect(SoqlHelpers.replaceHyphensWithUnderscores('asd-fds')).to.equal('asd_fds');
    }));
  });
});
