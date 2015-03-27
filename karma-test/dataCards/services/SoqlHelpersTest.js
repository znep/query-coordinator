describe('SoqlHelpers service', function() {
  'use strict';

  var DateHelpers;

  beforeEach(module('dataCards'));
  beforeEach(inject(function($injector) {
    DateHelpers = $injector.get('DateHelpers');
  }));

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
      expect(SoqlHelpers.encodeSoqlDate(DateHelpers.deserializeFloatingTimestamp('2014-08-01T16:36:24'))).to.equal("'2014-08-01T16:36:24'");
    }));
  });

  describe('SOQL primitive encoder', function() {
    var soqlHelpers;
    beforeEach(inject(function(SoqlHelpers) {
      soqlHelpers = SoqlHelpers;
    }));

    it('should return the value untouched for booleans', function() {
      expect(soqlHelpers.encodePrimitive(true)).to.equal(true);
      expect(soqlHelpers.encodePrimitive(false)).to.equal(false);
    });

    it('should return the value untouched for numbers', function() {
      expect(soqlHelpers.encodePrimitive(1)).to.equal(1);
      expect(soqlHelpers.encodePrimitive(0)).to.equal(0);
    });

    it('should delegate to encodeSoqlString for strings', function() {
      var fakeReturnValue = 'a_special_value';
      var mockedEncode = sinon.stub(soqlHelpers, 'encodeSoqlString').returns(fakeReturnValue);

      var testPrimitives = [
        '',
        'non_empty'
      ];

      var returned = _.map(testPrimitives, soqlHelpers.encodePrimitive);

      expect(mockedEncode.callCount).to.equal(testPrimitives.length);
      expect(returned).to.deep.equal(_.times(testPrimitives.length, _.constant(fakeReturnValue))); // Verify passthrough.
      expect(_.flatten(mockedEncode.args)).to.deep.equal(testPrimitives); // Verify passed arguments.

      soqlHelpers.encodeSoqlString.restore();
    });

    it('should delegate to encodeSoqlDate for dates', function() {
      var fakeReturnValue = 'a_special_value';
      var mockedEncode = sinon.stub(soqlHelpers, 'encodeSoqlDate').returns(fakeReturnValue);

      var testPrimitives = [
        new Date(),
        new Date('2014-08-01T16:36:24')
      ];

      var returned = _.map(testPrimitives, soqlHelpers.encodePrimitive);

      expect(mockedEncode.callCount).to.equal(testPrimitives.length);
      expect(returned).to.deep.equal(_.times(testPrimitives.length, _.constant(fakeReturnValue))); // Verify passthrough.
      expect(_.flatten(mockedEncode.args)).to.deep.equal(testPrimitives); // Verify passed arguments.

      soqlHelpers.encodeSoqlDate.restore();
    });

    it('should throw errors on unsupported types', function() {
      expect(function() { soqlHelpers.encodePrimitive(undefined); }).to.throw();
      expect(function() { soqlHelpers.encodePrimitive(null); }).to.throw();
      expect(function() { soqlHelpers.encodePrimitive(0); }).to.not.throw();
      expect(function() { soqlHelpers.encodePrimitive(1); }).to.not.throw();
      expect(function() { soqlHelpers.encodePrimitive([]); }).to.throw();
      expect(function() { soqlHelpers.encodePrimitive(['']); }).to.throw();
      expect(function() { soqlHelpers.encodePrimitive({}); }).to.throw();
      expect(function() { soqlHelpers.encodePrimitive({a:2}); }).to.throw();
    });

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

  describe('stripWhereClauseFragmentForFieldName', function() {

    var buildActiveFilters = function(fieldName, value) {
      var soqlWhereFragment = '{0} = {1}'.format(fieldName, value);
      return [{ generateSoqlWhereFragment: _.constant(soqlWhereFragment) }];
    };

    it('should return undefined when the whereClause is empty', inject(function(SoqlHelpers) {
      expect(SoqlHelpers.stripWhereClauseFragmentForFieldName('fieldName', '', [])).to.equal(undefined);
    }));

    it('should strip out the whereClauseFragment that matches the fieldName', inject(function(SoqlHelpers) {
      var strippedWhereClause;

      strippedWhereClause = SoqlHelpers.stripWhereClauseFragmentForFieldName(
        'foo',
        'foo = 1 AND bar = 1 AND baz = 1',
        buildActiveFilters('foo', 1)
      );
      expect(strippedWhereClause).to.equal('(1=1) AND bar = 1 AND baz = 1');

      strippedWhereClause = SoqlHelpers.stripWhereClauseFragmentForFieldName(
        'bar',
        'foo = 1 AND bar = 2 AND baz = 3',
        buildActiveFilters('bar', 2)
      );
      expect(strippedWhereClause).to.equal('foo = 1 AND (1=1) AND baz = 3');

      strippedWhereClause = SoqlHelpers.stripWhereClauseFragmentForFieldName(
        'baz',
        'foo = 1 AND bar = 2 AND baz = 3',
        buildActiveFilters('baz', 3)
      );
      expect(strippedWhereClause).to.equal('foo = 1 AND bar = 2 AND (1=1)');
    }));

    it('should not change the whereClause when there are no matches for the fieldName', inject(function(SoqlHelpers) {
      var strippedWhereClause = SoqlHelpers.stripWhereClauseFragmentForFieldName(
        'baz',
        'foo = 1 AND bar = 2',
        buildActiveFilters('baz', 3)
      );
      expect(strippedWhereClause).to.equal('foo = 1 AND bar = 2');
    }));

  });

});
