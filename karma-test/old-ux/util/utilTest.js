describe('blist.util', function () {
  var util = blist.namespace.fetch('blist.util');

  describe('blist.util.recursivePluck', function () {
    it('should pluck out "world".', function () {
      var obj = {hello: 'world'};
      expect(util.recursivePluck(obj, 'hello')).to.eql(['world']);
    });

    it('should recursively pluck "world" and "someone".', function () {
      var obj = {hello: 'world', something: {hello: 'someone'}};
      expect(util.recursivePluck(obj, 'hello')).to.eql(['someone', 'world']);
    });

    it('should recursively pluck objects parts.', function () {
      var obj = {hello: {hello: {hello: 'world'}}};
      expect(util.recursivePluck(obj, 'hello')).to.eql([
        'world',
        {hello: 'world'},
        {hello: {hello: 'world'}}
      ]);
    });
  });
});
