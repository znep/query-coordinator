describe('blist.components.utils', function() {

  var utils = blist.namespace.fetch('blist.components.utils');

  describe('#classNames', function() {
    it('exists', function() {
      expect(utils).to.respondTo('classNames');
    });

    it('concatenates string arguments', function() {
      expect(utils.classNames('one', 'two', 'three')).to.eq('one two three');
      expect(utils.classNames('one')).to.eq('one');
    });

    it('handles the empty case', function() {
      expect(utils.classNames()).to.eq('');
    });

    it('flattens array arguments', function() {
      expect(utils.classNames(['one', 'two'], 'three', ['four', 'five'])).to.eq('one two three four five');
    });

    it('conditionally includes object keys based on their values', function() {
      var actual = utils.classNames({one: true, nope: false, two: true});
      expect(actual).to.contain('one').and.to.contain('two').and.to.not.contain('nope');
    });

    it('handles nested arrays', function() {
      expect(utils.classNames(['one', ['two', ['three']]])).to.eq('one two three');
    });
  });

});
