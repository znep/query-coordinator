export const setFeaturedContentItem = (item, position) => (
  { type: 'SET_FEATURED_CONTENT_ITEM', item, position }
);

export const removeFeaturedContentItem = (position) => (
  { type: 'REMOVE_FEATURED_CONTENT_ITEM', position }
);
