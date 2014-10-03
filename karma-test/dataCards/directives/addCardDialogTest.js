
describe('addCardDialog', function() {

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));

  beforeEach(module('/angular_templates/dataCards/addCardDialog.html'));
  beforeEach(module('/angular_templates/dataCards/card.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationColumnChart.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationChoropleth.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationTimelineChart.html'));
  beforeEach(module('/angular_templates/dataCards/timelineChart.html'));
  beforeEach(module('/angular_templates/dataCards/cardVisualizationTable.html'));
  beforeEach(module('/angular_templates/dataCards/table.html'));
  beforeEach(module('/angular_templates/dataCards/tableHeader.html'));

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
  }));

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    Card = $injector.get('Card');
    Page = $injector.get('Page');
    Model = $injector.get('Model');
    $rootScope = $injector.get('$rootScope');
    $controller = $injector.get('$controller');
    AngularRxExtensions = $injector.get('AngularRxExtensions');
  }));

  var columns = [
    {
      "name": "spot",
      "title": "Spot where cool froods hang out.",
      "description": "???",
      "logicalDatatype": "location",
      "physicalDatatype": "text",
      "importance": 2,
      "shapefileFeatureHumanReadablePropertyName": "spot"
    },
    {
      "name": "ward",
      "title": "Ward where crime was committed.",
      "description": "Batman has bigger fish to fry sometimes, you know.",
      "logicalDatatype": "location",
      "physicalDatatype": "text",
      "importance": 2,
      "shapefileFeatureHumanReadablePropertyName": "ward"
    }];

  function createDialog() {

    var datasetModel = new Model();
    datasetModel.id = "rook-king";
    datasetModel.defineObservableProperty('rowDisplayUnit', 'row');
    datasetModel.defineObservableProperty('columns', columns);

    var pageModel = new Page('asdf-fdsa');
    pageModel.set('dataset', datasetModel);
    pageModel.set('baseSoqlFilter', null);
    pageModel.set('cards', []);

    var datasetColumnsWithoutDataTable = pageModel.
      observe('dataset').
      observeOnLatest('columns').map(
        function(columns) {
          return _.values(_.omit(columns, '*'));
        });

    var datasetColumns = Rx.Observable.combineLatest(
      datasetColumnsWithoutDataTable,
      pageModel.observe('cards'),
      function(columns, cards) {

        var datasetColumns = [];
        var hasAvailableCards = false;

        var sortedColumns = columns.sort(function(a, b) { return a.name > b.name; });

        var sortedCards = cards.
          filter(function(card) { return card.fieldName !== '*'; }).
          sort(function(a, b) { return a.fieldName > b.fieldName });

        var i = 0;
        var j = 0;
        var available = false;
        var availableCardCount = sortedColumns.length;

        for (i = 0; i < sortedColumns.length; i++) {
          available = true;
          for (j = 0; j < sortedCards.length; j++) {
            if (sortedColumns[i].name === sortedCards[j].fieldName) {
              available = false;
              availableCardCount--;
            }
          }
          sortedColumns[i].available = available;
          datasetColumns.push(sortedColumns[i]);
        }

        return datasetColumns;

      });

    var outerScope = $rootScope.$new();

    AngularRxExtensions.install(outerScope);

    outerScope.page = pageModel;
    outerScope.bindObservable('cardModels', pageModel.observe('cards'));
    outerScope.bindObservable('datasetColumns', datasetColumns);

    var html = '<add-card-dialog page="page" card-models="cardModels" dataset-columns="datasetColumns"></add-card-dialog>';

    return {
      outerScope: outerScope,
      element: testHelpers.TestDom.compileAndAppend(html, outerScope),
      scope: outerScope.$$childHead
    };
  }

  describe('add card functionality', function() {

    describe('using the "Add a card" modal dialog', function() {

      it('should close the modal dialog and not add a card when the "Cancel" button is clicked', function() {
        var d = createDialog();

        var closed = false;

        d.outerScope.$on('modal-close-surrogate', function() {
          closed = true;
        });

        var button = null;

        var buttons = d.element.find('button');
        for (var i = 0; i < buttons.length; i++) {
          if ($(buttons[i]).text() === 'Cancel') {
            button = buttons[i];
            break;
          }
        }

        if (button !== null) {
          testHelpers.fireEvent(button, 'click');
        }

        expect(closed).to.be.true;
      });

      it('should show all columns as options in the "Choose a column..." select control', function() {
        var d = createDialog();

        var options = d.element.find('option').filter(
          function(index, option) {
            return option.value !== 'null';
          });
        expect(options.length).to.equal(2);
      });

      it('should disable columns that are represented by cards in the "Choose a column..." select control', function() {
        var d = createDialog();

        var serializedCard = {
          'fieldName': 'spot',
          'cardSize': 1,
          'cardCustomStyle': {},
          'expandedCustomStyle': {},
          'displayMode': 'visualization',
          'expanded': false
        };
        d.scope.page.set('cards', [Card.deserialize(d.scope.page, serializedCard)]);

        var options = d.element.find('option').filter(
          function(index, option) {
            return option.disabled !== true;
          });

        expect(options.length).to.equal(1);
      });

      it('should disable the "Add card" button when no column in the "Choose a column..." select control is selected', function() {
        var d = createDialog();

        var button = null;

        var buttons = d.element.find('button');
        for (var i = 0; i < buttons.length; i++) {
          if ($(buttons[i]).text() === 'Add card') {
            button = buttons[i];
            break;
          }
        }

        expect($(button).hasClass('disabled')).to.be.true;
      });

      it('should enable the "Add card" button when an enabled column in the "Choose a column..." select control is selected', function() {
        var d = createDialog();

        d.scope.addCardCardSize = 1;
        d.element.find('select').val('spot');
        testHelpers.fireEvent(d.element.find('select')[0], 'change');

        var button = null;

        var buttons = d.element.find('button');
        for (var i = 0; i < buttons.length; i++) {
          if ($(buttons[i]).text() === 'Add card') {
            button = buttons[i];
            break;
          }
        }

        expect($(button).hasClass('disabled')).to.be.false;
      });

      it('should display a sample card visualization when an enabled column in the "Choose a column..." select control is selected', function() {
        var d = createDialog();

        var serializedCard = {
          'fieldName': 'spot',
          'cardSize': 1,
          'cardCustomStyle': {},
          'expandedCustomStyle': {},
          'displayMode': 'visualization',
          'expanded': false
        };
        d.scope.page.set('cards', [Card.deserialize(d.scope.page, serializedCard)]);

        expect(d.element.find('card').length).to.equal(0);

        d.scope.addCardCardSize = 2;
        d.element.find('select').val('ward');
        testHelpers.fireEvent(d.element.find('select')[0], 'change');

        expect(d.element.find('card').length).to.equal(1);
      });

      it('should add a card in the correct CardSize group when an enabled column in the "Choose a column..." select control is selected and the "Add card" button is clicked', function() {
        var d = createDialog();

        var serializedCard = {
          'fieldName': 'spot',
          'cardSize': 1,
          'cardCustomStyle': {},
          'expandedCustomStyle': {},
          'displayMode': 'visualization',
          'expanded': false
        };
        d.scope.page.set('cards', [Card.deserialize(d.scope.page, serializedCard)]);

        d.scope.addCardCardSize = 2;
        d.element.find('select').val('ward');
        testHelpers.fireEvent(d.element.find('select')[0], 'change');

        d.scope.addCard();

        expect(d.scope.cardModels[0].fieldName).to.equal('spot');
        expect(d.scope.cardModels[1].fieldName).to.equal('ward');
      });

    });

  });

});
