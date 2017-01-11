/**
* These are helpers for the Pager component. They help the functional calculations of the pager's
* start and endpoints based on the total number of pages and the current page.
*/

// Returns an int for the page number to display as the leftmost pager link.
export function getPagerStart({ firstPage, lastPage, maxPageLinkCount, currentPage }) {
  // If we are on a page > (the last page - the median of the max number of links),
  // we want to show additional prev links so that we always show the maxPageLinkCount.

/* Example:
  Assume there are 100 total pages, and the currentPage is 100. maxPageLinkCount is 9.
  We would normally show 4 pages before the current page, and 4 pages after the current page.
  But since we are on the very last page, we want to instead show 8 pages before the current page.
  That is what `additionalPrevLinkCount` is representing. The additional 4 pages that are now
  going to be "prev" links instead of "next" links.
*/

  const pageLinkMedian = Math.floor(maxPageLinkCount / 2.0);
  let additionalPrevLinkCount = 0;
  const breakpoint = lastPage - pageLinkMedian;
  if (currentPage > breakpoint) {
    additionalPrevLinkCount = currentPage - breakpoint;
  }

  // Make sure we don't exceed the firstPage
  return Math.max(
    currentPage - pageLinkMedian - additionalPrevLinkCount,
    firstPage
  );
}

// Returns an int for the page number to display as the rightmost pager link.
export function getPagerEnd({ lastPage, maxPageLinkCount, currentPage }) {
  // If we are on a page < the halfway point, we want to show additional next links so that we always
  // show the maxPageLinkCount
  const pageLinkMedian = maxPageLinkCount / 2.0;
  let additionalNextLinkCount = 0;
  if (currentPage < Math.ceil(pageLinkMedian)) {
    additionalNextLinkCount = Math.ceil(pageLinkMedian) - currentPage;
  }

  // Make sure we don't exceed the lastPage
  return Math.min(
    currentPage + Math.floor(pageLinkMedian) + additionalNextLinkCount,
    lastPage
  );
}
