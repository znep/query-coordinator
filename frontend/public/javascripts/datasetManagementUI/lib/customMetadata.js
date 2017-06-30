/* eslint new-cap: 0 */
import daggy from 'daggy';
import _ from 'lodash';

export const Field = daggy.taggedSum('Field', {
  Text: ['name', 'label', 'value', 'isPrivate', 'isRequired', 'placeholder'],
  TextArea: ['name', 'label', 'value', 'isPrivate', 'isRequired', 'placeholder'],
  Tags: ['name', 'label', 'value', 'isPrivate', 'isRequired', 'placeholder'],
  Select: ['name', 'label', 'value', 'isPrivate', 'isRequired', 'options']
});

export const Fieldset = daggy.tagged('Fieldset', ['title', 'subtitle', 'fields']);

// shapeCustomFieldsets : List Obj -> {String :: Fieldset}
export const shapeCustomFieldsets = fieldsets =>
  fieldsets
    .map(fieldset => ({
      ...fieldset,
      fields: fieldset.fields.map(field => {
        const view = window.initialState.view;

        // existing values are stored on the view, so we need to look them up;
        // they are located in a different place, depending on public/private
        // status of the field
        const value = field.private
          ? _.get(view, `privateMetadata.custom_fields.${fieldset.name}.${field.name}`, null)
          : _.get(view, `metadata.custom_fields.${fieldset.name}.${field.name}`, null);

        if (field.options) {
          const options = [
            {
              title: '-- No Selection --',
              value: ''
            },
            ...field.options.map(option => ({
              title: option,
              value: option
            }))
          ];

          return Field.Select(field.name, field.name, value, field.private, field.required, options);
        } else {
          return Field.Text(field.name, field.name, value, field.private, field.required, null);
        }
      })
    }))
    .reduce(
      (acc, fieldset) => ({
        ...acc,
        [fieldset.name]: Fieldset(fieldset.name, null, fieldset.fields)
      }),
      {}
    );

// const model = {
//   fsone: {
//     title: 'a fieldset',
//     subtitle: 'this is a subtitle',
//     fields: [
//       {
//         name: 'name',
//         label: 'Name',
//         className: '',
//         value: 'rudolph',
//         required: true
//       },
//       {
//         name: 'age',
//         label: 'Age',
//         className: '',
//         value: '',
//         required: true
//       },
//       {
//         name: 'city',
//         label: 'City',
//         className: '',
//         value: 'Portland'
//       }
//     ]
//   }

//
// export const PRIVATE_CUSTOM_FIELD_PREFIX = 'private-custom-metadata';
// export const CUSTOM_FIELD_PREFIX = 'custom-metadata';
//
// export const makeNamespacedFieldName = (isPrivate, fieldName, fieldsetName) => {
//   const prefix = isPrivate ? PRIVATE_CUSTOM_FIELD_PREFIX : CUSTOM_FIELD_PREFIX;
//
//   return `${prefix}-${btoa(fieldsetName)}-${fieldName}`;
// };
//
// /*
// Takes custom metadata from nested shape used by DSLP to a flat shape used
// by DSMUI. Metadata shaped like this:
//   {
//     fielsetOne: {
//       name: 'bob',
//       age: 44
//     },
//     fieldsetTwo: {
//       address: '1234 Main St.',
//       city: 'Seattle'
//     }
//   }
//
// Will be transformed into this:
//
// {
//   custom-metadata-1234-name: bob,
//   custom-metadata-1234-age: 44,
//   custom-metadata-7878-city: 'Seattle',
//   etc.
// }
// */
// export const fromNestedToFlat = (obj = {}, isPrivate = false, fieldsetName = '') =>
//   Object.keys(obj).reduce((acc, key) => {
//     if (_.isPlainObject(obj[key])) {
//       return Object.assign(
//         {},
//         acc,
//         fromNestedToFlat(obj[key], isPrivate, key)
//       );
//     } else {
//       const fieldName = makeNamespacedFieldName(isPrivate, key, fieldsetName);
//       acc[fieldName] = obj[key];
//     }
//
//     return acc;
//   }, {});
//
// // Inverse of fromNestedToFlat; renests fields/fieldsets for saving to server
// export const fromFlatToNested = (obj = {}) => {
//   const fieldsetNames = Object.keys(obj).map(key => ({
//     hashedName: key.split('-')[key.split('-').length - 2],
//     unhashedName: atob(key.split('-')[key.split('-').length - 2])
//   }));
//
//   const uniqueFieldsetNames = _.uniqBy(fieldsetNames, 'unhashedName');
//
//   const nestedFieldsetObj = {};
//
//   uniqueFieldsetNames.forEach(fieldset => {
//     const fieldsetNameRegex = new RegExp(fieldset.hashedName);
//
//     const fieldsetFields = _.pickBy(obj, (v, k) => fieldsetNameRegex.test(k));
//
//     const nonNamespacedKeys = _.mapKeys(fieldsetFields, (v, k) => k.split('-').pop());
//
//     nestedFieldsetObj[fieldset.unhashedName] = nonNamespacedKeys;
//   });
//
//   return nestedFieldsetObj;
// };
