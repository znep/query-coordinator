import * as StringHelpers from '../../src/helpers/StringHelpers';

describe('StringHelpers', () => {
  describe('partitionByWordBoundaries should partition the string by word boundaries', () => {
    const MAX_CHAR = 15;

    const longString = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.';
    const shortString = 'lorem';

    it('should return array of rows containing maximum given length of characters', () => {
      const rows = StringHelpers.partitionByWordBoundaries(longString, MAX_CHAR);

      expect(rows[0]).to.equal('Lorem ipsum');
      expect(rows[1]).to.equal('dolor sit amet,');
      expect(rows[2]).to.equal('consectetur');
      expect(rows[3]).to.equal('adipisicing');
      expect(rows[4]).to.equal('elit.');
    });

    it('should return given string in an array if the string smaller than given maximum characters', () => {
      const rows = StringHelpers.partitionByWordBoundaries(shortString, MAX_CHAR);

      expect(rows.length).to.equal(1);
      expect(rows[0]).to.equal(shortString);
    });
  });
});
