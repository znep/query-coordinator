// Given a featured item, we need to figure out if it's a normal visualization, a story, or an
// external resource.  Normally the `contentType` would provide this information for us, but
// currently both stories and visualizations have a contentType of "internal".  We have been told
// that eventually we will not special case stories, in which case `contentType` will provide
// sufficient information and we can remove the concept of `editType` entirely.
export function getEditTypeFromFeaturedItem(featuredItem) {
  if (featuredItem.contentType === 'external') {
    return 'externalResource';
  } else if (featuredItem.contentType === 'internal') {
    if (featuredItem.featuredView.displayType === 'story') {
      return 'story';
    } else {
      return 'visualization';
    }
  }
}
