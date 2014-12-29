// Service responsible for providing versioned JSON schemas.
// Example usages:
//
// Adding a couple versions of the dataset_metadata schema:
// Schemas.regarding('dataset_metadata').addSchemaWithVersion('0', {some JJV Schema});
// Schemas.regarding('dataset_metadata').addSchemaWithVersion('0.1', {another JJV Schema});
//
// Validating against version 0.1 of the schema:
// if (Schemas.regarding('dataset_metadata').isValidAgainstVersion('0.1', {some blob})) {
//   alert('Blob validated!');
// }
//
angular.module('dataCards.services').factory('Schemas', function(JJV) {
  // Maps schema subject names ('dataset_metadata', 'page_metadata', etc) to a collection of versioned schemas
  // for that subject.
  // The collection of versioned schemas is stored as an object whose keys are versions and whose values are the JSON
  // schemas themselves.
  var versionedSchemaCollections = {};

  function fetchSchemaCollectionForSubject(schemaSubjectName) {
    var collection = versionedSchemaCollections[schemaSubjectName] || {};
    versionedSchemaCollections[schemaSubjectName] = collection;
    return collection;
  }

  function regarding(schemaSubjectName) {
    return {
      // Checks the given object for validity on a particular version of this schema.
      // Returns a validation object:
      // {
      //   valid: Boolean. True if the object matches this version schema, false otherwise.
      //   errors: Array of validation errors, or null if the object validated.
      // }
      validateAgainstVersion: function(schemaVersion, objectToValidate) {
        var schemaCollection = fetchSchemaCollectionForSubject(schemaSubjectName);
        var schemaWithDesiredVersion = schemaCollection[schemaVersion];

        var validationErrors = JJV.validate(schemaWithDesiredVersion, objectToValidate);
        return {
          valid: _.isEmpty(validationErrors),
          errors: validationErrors
        }
      },

      // Checks the given object for validity on a particular version of this schema.
      // Returns true of the object matches this version schema, false otherwise.
      // If you want access to the validation errors, use validateAgainstVersion.
      isValidAgainstVersion: function(schemaVersion, objectToValidate) {
        return this.validateAgainstVersion(schemaVersion, objectToValidate).valid;
      },

      addSchemaWithVersion: function(schemaVersion, schema) {
        fetchSchemaCollectionForSubject(schemaSubjectName)[schemaVersion] = schema;
      }
    };
  }

  return {
    regarding: regarding
  };
});
