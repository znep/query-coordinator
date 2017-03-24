export const updateHeadline = (text) => (
  { type: 'UPDATE_HEADLINE', text }
);

export const updateDescription = (text) => (
  { type: 'UPDATE_DESCRIPTION', text }
);

export const toggleStats = (checked) => (
  { type: 'TOGGLE_STATS', checked }
);