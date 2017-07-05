import { assert } from 'chai';
import * as Validators from 'lib/validators';

describe('lib/validators', () => {
  describe('hasValue', () => {
    it('returns success if value is truthy', () => {
      const res = Validators.hasValue('name', 'snu').matchWith({
        Success: x => x.value,
        Failure: () => 'failed'
      });

      assert.equal(res, 'snu');
    });

    it('returns failure if value is falsey', () => {
      const res = Validators.hasValue('name', '').matchWith({
        Success: x => x.value,
        Failure: x => x.value[0].message
      });

      const resTwo = Validators.hasValue('name', null).matchWith({
        Success: x => x.value,
        Failure: x => x.value[0].message
      });

      const resThree = Validators.hasValue('name', undefined).matchWith({
        Success: x => x.value,
        Failure: x => x.value[0].message
      });

      assert.equal(res, 'This field is required');
      assert.equal(resTwo, 'This field is required');
      assert.equal(resThree, 'This field is required');
    });
  });

  describe('areUnique', () => {
    it('succeeds if values are all unique', () => {
      const val = ['one', 'two', 'three'];

      const res = Validators.areUnique('tags', val).matchWith({
        Success: x => x.value,
        Failure: x => x.value[0].message
      });

      assert.deepEqual(res, val);
    });

    it('fails if values are not unique', () => {
      const val = ['one', 'two', 'three', 'two'];

      const res = Validators.areUnique('tags', val).matchWith({
        Success: x => x.value,
        Failure: x => x.value[0].message
      });

      assert.equal(res, 'Tags must be unique');
    });
  });

  describe('isURL', () => {
    it('succeeds if value is valid url', () => {
      const val = 'http://www.socrata.com';

      const res = Validators.isURL('sourceLink', val).matchWith({
        Success: x => x.value,
        Failure: x => x.value[0].message
      });

      assert.equal(res, val);
    });

    it('fails if value is not valid url', () => {
      const val1 = 'dog';
      const val2 = 'socrata.com';

      const res1 = Validators.isURL('sourceLink', val1).matchWith({
        Success: x => x.value,
        Failure: x => x.value[0].message
      });

      const res2 = Validators.isURL('sourceLink', val2).matchWith({
        Success: x => x.value,
        Failure: x => x.value[0].message
      });

      assert.equal(res1, 'Please enter a valid url');
      assert.equal(res2, 'Please enter a valid url');
    });
  });

  describe('isEmail', () => {
    it('succeeds if value is valid email', () => {
      const val = 'snu@socrata.com';

      const res = Validators.isEmail('email', val).matchWith({
        Success: x => x.value,
        Failure: x => x.value[0].message
      });

      assert.equal(res, val);
    });

    it('fails if value is invalid email', () => {
      const val = 'not an email';

      const res = Validators.isEmail('email', val).matchWith({
        Success: x => x.value,
        Failure: x => x.value[0].message
      });

      assert.equal(res, 'Please enter a valid email address');
    });
  });

  describe('dependsOn', () => {
    const dependee = {
      name: 'attribution',
      value: 'Creative Commons Guy'
    };

    const dependent = {
      name: 'license',
      value: 'creative commons'
    };

    it('succeeds if dependee is truthy', () => {
      const res = Validators.dependsOn(dependent, dependee).matchWith({
        Success: x => x.value,
        Failure: x => x.value[0].message
      });

      assert.equal(res, dependent.value);
    });

    it('fails if dependee is falsey', () => {
      const emptyDependee = {
        ...dependee,
        value: null
      };

      const res = Validators.dependsOn(dependent, emptyDependee).matchWith({
        Success: x => x.value,
        Failure: x => x.value[0].message
      });

      assert.equal(
        res,
        "License type requires attribution. Please complete 'Data Provided By' field."
      );
    });
  });

  describe('isUnique', () => {
    it('succeeds if value is unique in a set of values', () => {
      const val = 'name';
      const values = ['name', 'email', 'location'];

      const res = Validators.isUnique(
        'field-name-name',
        val,
        values
      ).matchWith({
        Success: x => x.value,
        Failure: x => x.value[0].message
      });

      assert.equal(res, val);
    });

    it('fails if a value has a duplicate in a set of values', () => {
      const val = 'name';
      const values = ['name', 'email', 'location', 'name'];

      const res = Validators.isUnique(
        'field-name-name',
        val,
        values
      ).matchWith({
        Success: x => x.value,
        Failure: x => x.value[0].message
      });

      assert.equal(res, 'Field names must be unique');
    });
  });
});
