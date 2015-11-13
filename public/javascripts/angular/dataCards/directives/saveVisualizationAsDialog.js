(function() {
  'use strict';

  function saveVisualizationAsDialog(
    $http,
    $window,
    I18n,
    VIFExportService,
    FlyoutService
  ) {
    return {
      restrict: 'E',
      scope: {
        showProvenanceSection: '=',
        dialogState: '=',
        domain: '=',
        page: '='
      },
      templateUrl: '/angular_templates/dataCards/saveVisualizationAsDialog.html',
      link: function($scope, element) {
        $scope.categories = $scope.domain.categories;
        $scope.category = null;

        $scope.isOfficial = false;

        $scope.description = '';
        $scope.name = '';
        $('#save-visualization-as-name').focus();
        var nameValid$ = $scope.$observe('name').map(_.negate(_.isEmpty));

        $scope.invalid = false;
        var saveClicks$ = Rx.Observable.fromEvent(element.find('save-button'), 'click');

        var validState$ = saveClicks$.combineLatest(nameValid$, function(_, nameValid) {
          return nameValid;
        });

        $scope.$bindObservable('nameInvalid', validState$.map(function(x) { return !x; }));

        Rx.Observable.subscribeLatest(
          saveClicks$.withLatestFrom(validState$, function(a, b) { return b; }).filter(_.identity),
          $scope.page.observe('dataset'),
          function(valid, dataset) {
            $scope.$safeApply(function() {
              if (valid) {

                $scope.saveStatus = 'saving';

                var uniqueId = $scope.dialogState.cardModel.uniqueId;
                var vif = VIFExportService.exportVIF($scope.page, uniqueId, $scope.name, $scope.description);
                var payload = {
                  datasetId: dataset.id,
                  category: $scope.category,
                  isOfficial: $scope.isOfficial,
                  vif: vif
                };

                $http.post('/metadata/v1/standalone_viz.json', payload).
                  then(function(response) {
                    $scope.saveStatus = 'saved';
                    $window.location = I18n.a('/view/{0}'.format(response.data.id));
                  }, function() {
                    $scope.saveStatus = 'failed';
                  });
                $scope.invalid = false;

              } else {

                $scope.invalid = true;

              }
            });
          }
        );

        FlyoutService.register({
          selector: '#save-as-invalid-name',
          render: _.constant(I18n.saveVisualizationAsDialog.enterNameError)
        });

        FlyoutService.register({
          selector: '.save-button.error',
          render: _.constant(I18n.saveVisualizationAsDialog.serverError)
        });

      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('saveVisualizationAsDialog', saveVisualizationAsDialog);

})();
