import { assert, expect } from 'chai';
import { Success, Failure } from 'folktale/validation';

import * as Validators from 'validators';


describe('validators', () => {

  describe('isValidEmailGroup', () => {

    it('succeeds with a list of emails', () => {
      const testValue = 'test1@example.com, test2@example.com';
      const result = Validators.isValidEmailGroup(testValue);
      expect(result).to.be.an.instanceOf(Success);
      expect(result.unsafeGet()).to.eq(testValue);
    });

    it('fails with an empty value', () => {
      const result = Validators.isValidEmailGroup('');
      expect(result).to.be.an.instanceOf(Failure);
      expect(result.value[0]).to.eql({ translationKey: 'users.errors.no_emails_provided' });
    });

    it('fails with a missing value', () => {
      const result = Validators.isValidEmailGroup();
      expect(result).to.be.an.instanceOf(Failure);
      expect(result.value[0]).to.eql({ translationKey: 'users.errors.no_emails_provided' });
    });

    it('fails with an invalid email', () => {
      const result1 = Validators.isValidEmailGroup('invalid');
      expect(result1).to.be.an.instanceOf(Failure);
      expect(result1.value[0]).to.eql({ translationKey: 'users.errors.invalid_email', value: 'invalid' });
      const result2 = Validators.isValidEmailGroup('test@example.com, invalid');
      expect(result2).to.be.an.instanceOf(Failure);
      expect(result2.value[0]).to.eql({ translationKey: 'users.errors.invalid_email', value: 'invalid' });
      const result3 = Validators.isValidEmailGroup('invalid1, test@example.com, invalid2');
      expect(result3).to.be.an.instanceOf(Failure);
      expect(result3.value).to.have.length(2);
      expect(result3.value[0]).to.eql({ translationKey: 'users.errors.invalid_email', value: 'invalid1' });
      expect(result3.value[1]).to.eql({ translationKey: 'users.errors.invalid_email', value: 'invalid2' });
    });
  });

  describe('isValidRoleId', () => {

    it('succeeds if a roleId is provided', () => {
      const result = Validators.isValidRoleId(1);
      expect(result).to.be.an.instanceOf(Success);
      expect(result.unsafeGet()).to.eq(1);
    });

    it('fails if no roleId is provided', () => {
      const result = Validators.isValidRoleId();
      expect(result).to.be.an.instanceOf(Failure);
      expect(result.value).to.have.length(1);
      expect(result.value[0]).to.eql({ translationKey: 'users.errors.invalid_role_selected' });
    });

    it('fails if roleId is invalid', () => {
      const result = Validators.isValidRoleId('invalid');
      expect(result).to.be.an.instanceOf(Failure);
      expect(result.value).to.have.length(1);
      expect(result.value[0]).to.eql({ translationKey: 'users.errors.invalid_role_selected' });
    });

  });
});
