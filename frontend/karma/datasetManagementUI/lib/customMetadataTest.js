import { assert } from 'chai';
import {
  makeNamespacedFieldName,
  fromNestedToFlat,
  fromFlatToNested,
  PRIVATE_CUSTOM_FIELD_PREFIX,
  CUSTOM_FIELD_PREFIX
} from 'lib/customMetadata';

describe('lib/customMetadata', () => {
  describe('lib/customMetadata/makeNamespacedFieldName', () => {
    const privateField = {
      isPrivate: true,
      fieldsetName: 'awesome fieldset name',
      fieldname: 'test name'
    };

    const publicField = {
      ...privateField,
      isPrivate: false
    };

    it('correctly renames a public field name', () => {
      const newFieldname = makeNamespacedFieldName(
        publicField.isPrivate,
        publicField.fieldname,
        publicField.fieldsetName
      );

      assert.isTrue(newFieldname.includes(CUSTOM_FIELD_PREFIX));
      assert.isTrue(newFieldname.includes(btoa(publicField.fieldsetName)));
    });

    it('correctly renames a private fieldName', () => {
      const newFieldname = makeNamespacedFieldName(
        privateField.isPrivate,
        privateField.fieldname,
        privateField.fieldsetName
      );

      assert.isTrue(newFieldname.includes(PRIVATE_CUSTOM_FIELD_PREFIX));
      assert.isTrue(newFieldname.includes(btoa(privateField.fieldsetName)));
    });
  });

  describe('lib/customMetadata/fromNestedToFlat', () => {
    const nestedFieldset = {
      'dog info': {
        name: 'FRED THE DOG!!!',
        food: 'PEOPLEFOOD'
      },
      'cat info': {
        name: 'yep'
      }
    };

    const expectedFlattendObj = {
      'custom-metadata-ZG9nIGluZm8=-name': 'FRED THE DOG!!!',
      'custom-metadata-ZG9nIGluZm8=-food': 'PEOPLEFOOD',
      'custom-metadata-Y2F0IGluZm8=-name': 'yep'
    };

    it('converts nested fieldset object to flat namespaced object', () => {
      assert.deepEqual(
        fromNestedToFlat(nestedFieldset, false),
        expectedFlattendObj
      );
    });

    it('is isomorphic to fromFlatToNested', () => {
      assert.deepEqual(
        fromFlatToNested(fromNestedToFlat(nestedFieldset, false)),
        nestedFieldset
      );
    });
  });

  describe('lib/customMetadata/fromFlatToNested', () => {
    const expectedNestedFieldset = {
      'dog info': {
        name: 'FRED THE DOG!!!',
        food: 'PEOPLEFOOD'
      },
      'cat info': {
        name: 'yep'
      }
    };

    const flattendFormDataModel = {
      'custom-metadata-ZG9nIGluZm8=-name': 'FRED THE DOG!!!',
      'custom-metadata-ZG9nIGluZm8=-food': 'PEOPLEFOOD',
      'custom-metadata-Y2F0IGluZm8=-name': 'yep'
    };

    it('converts a flat form data-model to a nested object', () => {
      assert.deepEqual(
        fromFlatToNested(flattendFormDataModel),
        expectedNestedFieldset
      );
    });

    it('is isomorphic to fromNestedToFlat', () => {
      assert.deepEqual(
        fromNestedToFlat(fromFlatToNested(flattendFormDataModel)),
        flattendFormDataModel
      );
    });
  });
});
