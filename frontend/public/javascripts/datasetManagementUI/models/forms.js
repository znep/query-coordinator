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

// shapeCustomFieldsets : String a => List Obj -> {a : Fieldset}
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
