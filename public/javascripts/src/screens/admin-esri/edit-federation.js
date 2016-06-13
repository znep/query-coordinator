/**
 * For 508 compliance, this page needs to render without javascript
 * The functionality here is non-essential, simply faciliating checkbox selection
 */

function parentOf($el) {
  const parentId = $el.data('parent-id');
  const parentType = $el.data('parent');

  if (!parentId || !parentType) { return false; }

  return $(`input[data-id="${parentId}"][data-type="${parentType}"]`);
}

function childrenOf($el) {
  const id = $el.data('id');
  const type = $el.data('type');

  return $(`input[data-parent-id="${id}"][data-parent="${type}"]`);
}

function matchSync($el, $other) {
  if ($el.is(':checked')) {
    $other.attr('checked', $el.attr('checked'));
  } else {
    $other.removeAttr('checked');
  }
}

function cascadeSyncDown($el) {
  childrenOf($el).each((_index, child) => {
    const $child = $(child);
    matchSync($el, $child);
    cascadeSyncDown($child);
  });
}

function cascadeUnsyncUp($el) {
  const $parent = parentOf($el);
  if (!$parent) { return; }
  matchSync($el, $parent);
  cascadeUnsyncUp($parent);
}

// Yea using 1 and 0 for t/f is dumb but checkboxes...and consistency
function onChecked(event) {
  const $target = $(event.currentTarget);
  if ($target.is(':checked')) {
    cascadeSyncDown($target);
  } else {
    cascadeUnsyncUp($target);
    cascadeSyncDown($target);
  }
}

function filterAssets($el) {
  const children = childrenOf($el);
  if (children.length === 0) {
    return $el.data('term');
  }
  return $.map(children, ( child) => {
    return filterAssets($(child));
  }).join(' ') + ' ' + $el.data('term');
}

$(() => {
  $('.filter-assets .searchBox').on('keyup', (event) => {
    const term = $(event.currentTarget).val().toLowerCase();

    $('input.sync-type').each((_index, el) => {
      const $el = $(el);
      const contents = filterAssets($el);
      const $wrapper = $el.closest('.search-item');
      if (contents.toLowerCase().indexOf(term) === -1) {
        $wrapper.hide();
      } else {
        $wrapper.show();
      }
    });
  });

  $('.sync-type').change(onChecked);
});
