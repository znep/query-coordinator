import { classNames } from 'components/utils';

describe('blist.components.utils', function() {

  describe('#classNames', function() {
    it('concatenates string arguments', function() {
      expect(classNames('one', 'two', 'three')).to.eq('one two three');
      expect(classNames('one')).to.eq('one');
    });

    it('handles the empty case', function() {
      expect(classNames()).to.eq('');
    });

    it('flattens array arguments', function() {
      expect(classNames(['one', 'two'], 'three', ['four', 'five'])).to.eq('one two three four five');
    });

    it('conditionally includes object keys based on their values', function() {
      var actual = classNames({one: true, nope: false, two: true});
      expect(actual).to.contain('one').and.to.contain('two').and.to.not.contain('nope');
    });

    it('handles nested arrays', function() {
      expect(classNames(['one', ['two', ['three']]])).to.eq('one two three');
    });
  });

});
