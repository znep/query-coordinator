import * as pagerHelpers from 'lib/pagerHelpers';

describe('lib/pagerHelpers', function() {
  const firstPage = 1;
  const maxPageLinkCount = 9;

  describe('getPagerStart', function() {
    describe('when the currentPage is less than or equal to maxPageLinkCount / 2', function() {
      it('returns the firstPage', function() {
        var result = pagerHelpers.getPagerStart({
          firstPage,
          maxPageLinkCount,
          lastPage: 10,
          currentPage: 1
        });

        expect(result).to.eq(firstPage);

        var result2 = pagerHelpers.getPagerStart({
          firstPage,
          maxPageLinkCount: 50,
          lastPage: 1000,
          currentPage: 25
        });

        expect(result2).to.eq(firstPage);

        var result3 = pagerHelpers.getPagerStart({
          firstPage,
          maxPageLinkCount,
          lastPage: 2,
          currentPage: 1
        });

        expect(result3).to.eq(firstPage);
      });
    });

    describe('when the currentPage is greater than maxPageLinkCount / 2', function() {
      it('returns the currentPage + (maxPageLinkCount / 2)', function() {
        var result = pagerHelpers.getPagerStart({
          firstPage,
          maxPageLinkCount,
          lastPage: 300,
          currentPage: 50
        });

        expect(result).to.eq(46);

        var result2 = pagerHelpers.getPagerStart({
          firstPage,
          maxPageLinkCount: 20,
          lastPage: 234,
          currentPage: 50
        });

        expect(result2).to.eq(40);
      });
    });

    describe('when the currentPage > lastPage - maxPageLinkCount / 2', function() {
      it('accounts for the lack of additional pages by reducing the pager start', function() {
        var result = pagerHelpers.getPagerStart({
          firstPage,
          maxPageLinkCount,
          lastPage: 50,
          currentPage: 50
        });

        expect(result).to.eq(42);

        var result2 = pagerHelpers.getPagerStart({
          firstPage,
          maxPageLinkCount: 40,
          lastPage: 200,
          currentPage: 190
        });

        expect(result2).to.eq(160);
      });

      it('can not be less than the firstPage', function() {
        var result = pagerHelpers.getPagerStart({
          firstPage,
          maxPageLinkCount: 10,
          lastPage: 2,
          currentPage: 2
        });

        expect(result).to.eq(1);
      });
    });
  });

  describe('getPagerEnd', function() {
    describe('when the currentPage > maxPageLinkCount / 2', function() {
      it('returns currentPage + maxPageLinkCount / 2', function() {
        var result = pagerHelpers.getPagerEnd({ lastPage: 20, maxPageLinkCount, currentPage: 11 });
        expect(result).to.eq(15);

        var result2 = pagerHelpers.getPagerEnd({ lastPage: 100, maxPageLinkCount, currentPage: 50 });
        expect(result2).to.eq(54);
      });

      it('does not exceed the lastPage', function() {
        var result = pagerHelpers.getPagerEnd({ lastPage: 220, maxPageLinkCount, currentPage: 220 });
        expect(result).to.eq(220);

        var result2 = pagerHelpers.getPagerEnd({ lastPage: 220, maxPageLinkCount, currentPage: 217 });
        expect(result2).to.eq(220);
      });
    });

    describe('when the currentPage <= maxPageLinkCount / 2', function() {
      it('accounts for the lack of additional pages by increasing the pager end', function() {
        var result = pagerHelpers.getPagerEnd({ lastPage: 20, maxPageLinkCount, currentPage: 1 });
        expect(result).to.eq(9);

        var result2 = pagerHelpers.getPagerEnd({ lastPage: 20, maxPageLinkCount, currentPage: 4 });
        expect(result2).to.eq(9);

        var result3 = pagerHelpers.getPagerEnd({ lastPage: 20, maxPageLinkCount: 12, currentPage: 4 });
        expect(result3).to.eq(12);
      });

      it('does not exceed the lastPage', function() {
        var result = pagerHelpers.getPagerEnd({ lastPage: 5, maxPageLinkCount, currentPage: 1 });
        expect(result).to.eq(5);
      });
    });
  });
});
