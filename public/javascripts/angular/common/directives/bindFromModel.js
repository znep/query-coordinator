// Binds properties on a Model supporting the observe() call to angular scope fields. The scope
// fields are given the same name as the property name on the model.
// A new scope context is created by this directive.
//
// Example.
// Assume:
//  * myModel is defined on the current scope, and is an instance of Model.
//  * myModel has two properties, name and description.
//
// To use this directive to bind name and description to DOM nodes, you can say:
// <div scope-bind-from-model="myModel.name, myModel.description">
//   <h1>{{name}}</h1>
//   <p>{{description}}</p>
// </div>
angular.module('socrataCommon.directives').directive('scopeBindFromModel', function(AngularRxExtensions) {
  return {
    restrict: 'A',
    scope: true,
    link: function(scope, element, attrs) {
      AngularRxExtensions.install(scope);

      var properties = attrs['scopeBindFromModel'].split(',');

      _.each(properties, function(keyPathString) {
        var keyPath = keyPathString.trim().split('.');

        if (keyPath.length < 2) {
          //TODO when observe takes deep paths, update this.
          throw new Error('scopeBindFromModel expects two or more entries in the key path, the first being the model name on the scope and the second a property name on the model.');
        }

        var scopePropertyToWriteTo = _.last(keyPath);
        var keyPathFromModel = _.rest(keyPath).join('.');

        // Get a sequence of models from the scope, according to the model expression.
        scope.bindObservable(
          scopePropertyToWriteTo,
          scope.observe(_.first(keyPath)).observeOnLatest(keyPathFromModel)
        );

      });
    }
  }
});
