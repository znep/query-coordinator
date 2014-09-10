describe('Mutable tile layout (UIController) controller test', function() {
  var service;
  beforeEach(function() {
    module('dataCards.services');
    inject(function($injector) {
      service = $injector.get('UIController');
      expect(service).to.exist;
    });
  });

  describe('data model', function() {
    it('should call layoutFn when the dataModel is changed', function() {
      var layoutFn = sinon.spy();
      var dataModelObservable = new Rx.Subject();
      var instance = service.initialize(layoutFn, dataModelObservable);
      expect(layoutFn.called).to.be.false;

      var model1 = ['a'];
      var model2 = ['b'];
      dataModelObservable.onNext(model1);
      expect(layoutFn.calledOnce).to.be.true;
      //TODO the zero needs to go. It's an artifice of how we pass through scroll position...
      expect(layoutFn.calledWithExactly(model1[0], 0)).to.be.true;
      dataModelObservable.onNext(model2);
      expect(layoutFn.calledTwice).to.be.true;
      //TODO the zero needs to go. It's an artifice of how we pass through scroll position...
      expect(layoutFn.calledWithExactly(model2[0], 0)).to.be.true;
    });
    it('should throw and not call layoutFn when the dataModel is changed to a non-array', function() {
      var layoutFn = sinon.spy();
      var dataModelObservable = new Rx.Subject();
      var instance = service.initialize(layoutFn, dataModelObservable);
      expect(layoutFn.called).to.be.false;
      expect(function() { dataModelObservable.onNext(); }).to.throw();
      expect(function() { dataModelObservable.onNext(3); }).to.throw();
      expect(function() { dataModelObservable.onNext('a'); }).to.throw();
      expect(function() { dataModelObservable.onNext({}); }).to.throw();
      expect(layoutFn.called).to.be.false;
    });
  });

  describe('layout cycle', function() {
    it('should not transition through UILayoutState to UIRestState until the dataModel is provided.', function() {
      var layoutFn = sinon.spy(function() {
        expect(instance.getState()).to.equal('UILayoutState');
      });

      var dataModelObservable = new Rx.Subject();
      var instance = service.initialize(layoutFn, dataModelObservable);
      expect(layoutFn.called).to.be.false;
      expect(instance.getState()).to.be.null;

      dataModelObservable.onNext([]);
      expect(instance.getState()).to.equal('UIRestState');
    });
  });

});
