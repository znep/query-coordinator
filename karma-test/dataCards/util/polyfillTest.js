// Taken from es-collections polyfill https://github.com/WebReflection/es6-collections/blob/master/test/index.js
describe('polyfills', function() {
  'use strict';

  describe('ES6 Map', function() {
    var Map = polyfills.Map;

    it('should exist', function () {
      expect(Map).to.exist.and.to.equal(polyfills.Map);
    });

    it('should be able to be constructed', function() {
      expect(new Map).to.be.instanceOf(Map);
      expect(new Map()).to.be.instanceOf(Map);
      var a = 1;
      var b = {};
      var c = new Map();
      var m = new Map([[1,1], [b,2], [c, 3]]);
      expect(m.has(a)).to.equal(true);
      expect(m.has(b)).to.equal(true);
      expect(m.has(c)).to.equal(true);
      expect(m.has('foo')).to.equal(false);
      expect(m.size).to.equal(3);
      if ('__proto__' in {}) {
        expect((new Map).__proto__.isPrototypeOf(new Map())).to.equal(true);
        expect((new Map).__proto__).to.equal(Map.prototype);
      }
    });

    describe('#has', function() {
      it('should exist', function() {
        var m = new Map();
        expect(m).to.respondTo('has');
      });

      it('checks existence in Map', function() {
        var o = new Map();
        var generic = {};
        var callback = function () {};

        expect(o.has(callback)).to.equal(false);
        o.set(callback, generic);
        expect(o.has(callback)).to.equal(true);
      });
    });

    describe('#set', function() {
      it('should exist', function() {
        var m = new Map();
        expect(m).to.respondTo('set');
      });

      it('should set entries in the Map', function() {
        var o = new Map();
        var generic = {};
        var callback = function () {};

        o.set(callback, generic);
        expect(o.get(callback)).to.equal(generic);
        o.set(callback, callback);
        expect(o.get(callback)).to.equal(callback);
        o.set(callback, o);
        expect(o.get(callback)).to.equal(o);
        o.set(o, callback);
        expect(o.get(o)).to.equal(callback);
        o.set(NaN, generic);
        expect(o.has(NaN)).to.equal(true);
        expect(o.get(NaN)).to.equal(generic);
        o.set('key', undefined);
        expect(o.has('key')).to.equal(true);
        expect(o.get('key')).to.equal(undefined);

        expect(o.has(-0)).to.equal(false);
        expect(o.has(0)).to.equal(false);
        o.set(-0, callback);
        expect(o.has(-0)).to.equal(true);
        expect(o.has(0)).to.equal(true);
        expect(o.get(-0)).to.equal(callback);
        expect(o.get(0)).to.equal(callback);
        o.set(0, generic);
        expect(o.has(-0)).to.equal(true);
        expect(o.has(0)).to.equal(true);
        expect(o.get(-0)).to.equal(generic);
        expect(o.get(0)).to.equal(generic);
      });
    });

    describe('#get', function() {
      it('should exist', function() {
        var o = new Map();
        expect(o).to.respondTo('get');
      });

      it('should get entries from the Map', function() {
        var o = new Map();
        var generic = {};
        var callback = function () {};

        o.set(callback, generic);
        expect(o.get(callback, 123)).to.equal(generic);
        expect(o.get(callback)).to.equal(generic);
      })

    });

    describe('#size', function() {
      it('should exist', function() {
        var o = new Map();
        expect(o).to.have.property('size');
      });

      it('should return the number of Map entries', function() {
        var o = new Map();
        expect(o.size).to.equal(0);
        o.set('a', 'a');
        expect(o.size).to.equal(1);
        o['delete']('a');
        expect(o.size).to.equal(0);
      });
    });

    describe('#["delete"]', function() {
      it('should exist', function() {
        var o = new Map();
        expect(o).to.respondTo('delete');
      });

      it('should delete entries from the Map', function() {
        var o = new Map();
        var generic = {};
        var callback = function () {};

        o.set(callback, generic);
        o.set(generic, callback);
        o.set(o, callback);
        expect(o.has(callback)).to.equal(true);
        expect(o.has(generic)).to.equal(true);
        expect(o.has(o)).to.equal(true);
        o['delete'](callback);
        o['delete'](generic);
        o['delete'](o);
        expect(o.has(callback)).to.equal(false);
        expect(o.has(generic)).to.equal(false);
        expect(o.has(o)).to.equal(false);
        expect(o['delete'](o)).to.equal(false);
        o.set(o, callback);
        expect(o['delete'](o)).to.equal(true);
      });
    });

    describe('#clear', function() {
      it('should exist', function() {
        var o = new Map();
        expect(o).to.respondTo('clear');
      });

      it('should clear the entries from the Map', function() {
        var o = new Map();
        o.set(1, '1');
        o.set(2, '2');
        o.set(3, '3');
        o.clear();
        expect(o.size).to.equal(0);
      });
    });

    describe('#forEach', function() {
      it('should exist', function() {
        var o = new Map();
        expect(o).to.respondTo('forEach');
      });

      it('should forEach of Map entries', function() {
        var o = new Map(), i;
        o.set('key 0', 0);
        o.set('key 1', 1);
        o.forEach(function (value, key, obj) {
          expect(key).to.equal('key ' + value);
          expect(obj).to.equal(o);
          // even if dropped, keeps looping
          o['delete'](key);
        });
        expect(o.size).to.equal(0);
      });

      // Not supported
      xit('should work with mutations', function() {
        var o = new Map([['0', 0], ['1', 1], ['2', 2]]), seen = [];
        o.forEach(function (value, key, obj) {
          seen.push(value);
          expect(obj).to.equal(o);
          expect(''+value).to.equal(key);
          // mutations work as expected
          if (value === 1) {
            o.delete('0'); // remove from before current index
            o.delete('2'); // remove from after current index
            o.set('3', 3); // insertion
          } else if (value === 3) {
            o.set('0', 0); // insertion at the end
          }
        });
        expect(JSON.stringify(seen)).to.eql(JSON.stringify([0, 1, 3, 0]));
        expect(JSON.stringify(o._values)).to.eql(JSON.stringify([1, 3, 0]));
      });
    });

    // Not implemented, requires Iterators
    xdescribe('keys, values, entries behavior', function () {
      it('should work according to specification', function() {
        // test that things get returned in insertion order as per the specs
        var o = new Map([['1', 1], ['2', 2], ['3', 3]]);
        var keys = o.keys();
        var values = o.values();
        var k = keys.next();
        var v = values.next();
        assert(k.value === '1' && v.value === 1);
        o.delete('2');
        k = keys.next();
        v = values.next();
        assert(k.value === '3' && v.value === 3);
        // insertion of previously-removed item goes to the end
        o.set('2', 2);
        k = keys.next();
        v = values.next();
        assert(k.value === '2' && v.value === 2);
        // when called again, new iterator starts from beginning
        var entriesagain = o.entries();
        assert(entriesagain.next().value[0] === '1');
        assert(entriesagain.next().value[0] === '3');
        assert(entriesagain.next().value[0] === '2');
        // after a iterator is finished, don't return any more elements
        k = keys.next();
        v = values.next();
        assert(k.done && v.done);
        k = keys.next();
        v = values.next();
        assert(k.done && v.done);
        o.set('4', 4);
        k = keys.next();
        v = values.next();
        assert(k.done && v.done);
        // new element shows up in iterators that didn't yet finish
        assert(entriesagain.next().value[0] === '4');
        assert(entriesagain.next().done);
      })
    });

  });

});
