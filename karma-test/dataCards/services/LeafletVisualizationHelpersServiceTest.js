describe('LeafletVisualizationHelpersService', function() {
  'use strict';

  var LeafletVisualizationHelpersService;
  var LeafletHelpersService;
  var CardModel;
  var Model;
  var $rootScope;
  var testHelpers;
  var testExtent1 = {
    'southwest': [41.79998325207397, -87.85079956054688],
    'northeast': [41.95540515378059, -86.95953369140625]
  };

  var testExtent2 = {
    'southwest': [41.45507852101139, -88.14468383789062],
    'northeast': [42.12980284036179, -86.97738647460938]
  };

  beforeEach(function() {
    module('dataCards.services');
    module('socrataCommon.services');
    module('dataCards.models');
    module('test');
  });

  beforeEach(inject(function($injector) {
    LeafletVisualizationHelpersService = $injector.get('LeafletVisualizationHelpersService');
    LeafletHelpersService = $injector.get('LeafletHelpersService');
    CardModel = $injector.get('Card');
    Model = $injector.get('Model');
    $rootScope = $injector.get('$rootScope');
    testHelpers = $injector.get('testHelpers');
  }));

  describe('#setObservedExtentOnModel', function() {
    it('exists', function() {
      expect(LeafletVisualizationHelpersService).to.respondTo('setObservedExtentOnModel');
    });

    describe('calling `setOption` on the model in response to events on the scope', function() {
      var model;
      var cardModel;
      var scope;
      beforeEach(function() {
        model = new Model();
        model.version = 2;
        cardModel = new CardModel(model, 'react');
        sinon.stub(cardModel, 'setOption');
        scope = $rootScope.$new();
        LeafletVisualizationHelpersService.setObservedExtentOnModel(scope, cardModel);
      });

      afterEach(function() {
        cardModel.setOption.restore();
      });

      it('skips to the first event, which is the map settling', function() {
        scope.$emit('set-extent', 'ignored');
        expect(cardModel.setOption).to.not.have.been.called;
      });

      it('sets the mapExtent option on subsequent events', function() {
        scope.$emit('set-extent', 'ignored');
        scope.$emit('set-extent', _.clone(testExtent1));
        expect(cardModel.setOption).to.have.been.calledOnce;
        expect(cardModel.setOption).to.have.been.calledWith('mapExtent', testExtent1);
        scope.$emit('set-extent', _.clone(testExtent2));
        expect(cardModel.setOption).to.have.been.calledTwice;
        expect(cardModel.setOption).to.have.been.calledWith('mapExtent', testExtent2);
      });

    });
  });

  describe('#emitExtentEventsFromMap', function() {
    var map;
    var scope;

    beforeEach(function() {
      testHelpers.TestDom.append($('<div id="map" />'));
      map = L.map('map');
      scope = $rootScope.$new();
      LeafletVisualizationHelpersService.emitExtentEventsFromMap(scope, map);
    });

    afterEach(function() {
      testHelpers.TestDom.clear();
    });

    it('exists', function() {
      expect(LeafletVisualizationHelpersService).to.respondTo('emitExtentEventsFromMap');
    });

    it('should emit an event on extent change', function() {
      var eventSpy = sinon.spy();
      scope.$on('set-extent', eventSpy);
      map.fitBounds(LeafletHelpersService.buildBounds(testExtent1));
      expect(eventSpy).to.have.been.called;
    });
  });

});
