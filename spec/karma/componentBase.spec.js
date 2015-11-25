describe('componentBase jQuery plugin', function() {
  'use strict';

  var $component;
  var storyteller = window.socrata.storyteller;
  var componentData;
  function callWithOptions(options) {
    beforeEach(function() {
      componentData = {};
      $component.componentBase(componentData, 'theme', options);
    });
  }

  beforeEach(function() {
    testDom.append('<div>');
    $component = testDom.children('div');
  });

  it('should return a jQuery object for chaining', function() {
    assert.instanceOf(
      $component.componentBase(),
      $,
      'Returned value is not a jQuery collection');
  });

  it('should pass `componentData` to `withLayoutHeightFromComponentData`', function() {
    var componentData = {};

    sinon.stub($component, 'withLayoutHeightFromComponentData');

    $component.componentBase(
      componentData,
      'theme',
      {}
    );

    sinon.assert.calledWithExactly($component.withLayoutHeightFromComponentData, componentData);
  });

  describe('editMode not specified', function() {
    callWithOptions({});
    it('should not add editing class', function() {
      assert.isFalse($component.hasClass('editing'));
    });
  });

  describe('editMode = false', function() {
    callWithOptions({editMode: false});
    it('should not add editing class', function() {
      assert.isFalse($component.hasClass('editing'));
    });
  });

  describe('editMode = true', function() {
    callWithOptions({editMode: true});
    it('should add editing class', function() {
      assert.isTrue($component.hasClass('editing'));
    });
  });

  describe('editButtonSupported', function() {
    var componentEditButtonStub;

    beforeEach(function() {
      componentEditButtonStub = sinon.stub($component, 'componentEditButton');
    });

    describe('in edit mode', function() {
      describe('editButtonSupported not specified', function() {
        callWithOptions({ editMode: true });
        it('should call into `componentEditButton`', function() {
          sinon.assert.calledOnce(componentEditButtonStub);
        });
      });
      describe('editButtonSupported = true', function() {
        callWithOptions({ editMode: true, editButtonSupported: true });
        it('should call into `componentEditButton`', function() {
          sinon.assert.calledOnce(componentEditButtonStub);
        });
      });
      describe('editButtonSupported = false', function() {
        callWithOptions({ editMode: true, editButtonSupported: false });
        it('should not call into `componentEditButton`', function() {
          sinon.assert.notCalled(componentEditButtonStub);
        });
      });
    });

    describe('not in edit mode', function() {
      callWithOptions({ editMode: false });
      callWithOptions({ editMode: false, editButtonSupported: true });
      callWithOptions({ editMode: false, editButtonSupported: false });
      it('should never call into `componentEditButton`', function() {
        sinon.assert.notCalled(componentEditButtonStub);
      });
    });
  });

  describe('resizeSupported', function() {
    var componentResizableStub;

    beforeEach(function() {
      componentResizableStub = sinon.stub($component, 'componentResizable');
    });

    describe('in edit mode', function() {
      describe('resizeSupported not specified', function() {
        callWithOptions({ editMode: true });
        it('should not call into `componentResizable`', function() {
          sinon.assert.notCalled(componentResizableStub);
        });
      });
      describe('resizeSupported = true with and resizeOptions is not set', function() {
        callWithOptions({ editMode: true, resizeSupported: true });
        it('should call into `componentResizable` with an empty options hash', function() {
          sinon.assert.calledOnce(componentResizableStub);
          assert.deepEqual(componentResizableStub.args[0], [{}]); // This is the default resizeOptions.
        });
      });
      describe('resizeSupported = true and resizeOptions set', function() {
        var resizeOptions = { foo: 'bar' };
        callWithOptions({ editMode: true, resizeSupported: true, resizeOptions: resizeOptions });
        it('should call into `componentResizable` with resizeOptions', function() {
          sinon.assert.calledOnce(componentResizableStub);
          sinon.assert.calledWithExactly(componentResizableStub, resizeOptions);
        });
      });
      describe('resizeSupported = false', function() {
        callWithOptions({ editMode: true, resizeSupported: false });
        it('should not call into `componentResizable`', function() {
          sinon.assert.notCalled(componentResizableStub);
        });
      });
    });

    describe('not in edit mode', function() {
      callWithOptions({ editMode: false });
      callWithOptions({ editMode: false, resizeSupported: true });
      callWithOptions({ editMode: false, resizeSupported: false });
      it('should never call into `componentResizable`', function() {
        sinon.assert.notCalled(componentResizableStub);
      });
    });

  });

});
