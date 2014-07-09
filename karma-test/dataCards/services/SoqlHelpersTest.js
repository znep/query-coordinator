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
    it('should throw errors on non-strings', inject(function(SoqlHelpers) {
      expect(function() { SoqlHelpers.encodeSoqlString(undefined); }).to.throw();
      expect(function() { SoqlHelpers.encodeSoqlString(null); }).to.throw();
      expect(function() { SoqlHelpers.encodeSoqlString(0); }).to.throw();
      expect(function() { SoqlHelpers.encodeSoqlString(1); }).to.throw();
      expect(function() { SoqlHelpers.encodeSoqlString([]); }).to.throw();
      expect(function() { SoqlHelpers.encodeSoqlString(['']); }).to.throw();
      expect(function() { SoqlHelpers.encodeSoqlString({}); }).to.throw();
      expect(function() { SoqlHelpers.encodeSoqlString({a:2}); }).to.throw();
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
});
