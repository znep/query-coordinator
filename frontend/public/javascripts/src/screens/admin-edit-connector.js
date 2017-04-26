/**
 * For 508 compliance, this page needs to render without javascript ;_;
 * The functionality here is non-essential, simply faciliating checkbox selection
 */

function parentOf($el) {
  const parentId = $el.data('parent-id');
  const parentType = $el.data('parent');
  if (!parentId || !parentType) { return false; }
  return $(`select[data-id="${parentId}"][data-type="${parentType}"]`);
}

function childrenOf($el) {
  const id = $el.data('id');
  const type = $el.data('type');
  return $(`select[data-parent-id="${id}"][data-parent="${type}"]`);
}

// gets the span that holds the icon for the select operation
function spanForSelect($select) {
  const id = $select.data('id');
  return $(`#icon-for-${id}`);
}

function styleDivForSelect($select) {
  const id = $select.data('id');
  return $(`#style-div-for-${id}`);
}

function matchSync($el, $other) {
  if ($el.is(':checked')) {
    $other.attr('checked', $el.attr('checked'));
  } else {
    $other.removeAttr('checked');
  }
}

function cascadeSyncDown($el) {
  childrenOf($el, 'input').each((_index, child) => {
    const $child = $(child);
    matchSync($el, $child);
    cascadeSyncDown($child);
  });
}

function cascadeUnsyncUp($el) {
  const $parent = parentOf($el, 'input');
  if (!$parent) { return; }
  matchSync($el, $parent);
  cascadeUnsyncUp($parent);
}

// Yea using 1 and 0 for t/f is dumb but checkboxes...and consistency ;_;
function onChecked(event) {
  const $target = $(event.currentTarget);
  if ($target.is(':checked')) {
    cascadeSyncDown($target);
  } else {
    cascadeUnsyncUp($target);
    cascadeSyncDown($target);
  }
}

function onSelected(event) {
  const $target = $(event.currentTarget);
  const selected = $target.children(':selected').val();
  changeClassForSelection($target, selected);
  cascadeUnselectUp($target, selected);
  cascadeSelectDown($target, selected);
}

function cascadeSelectDown($el, selected) {
  childrenOf($el, 'select').each((_index, child) => {
    const $child = $(child);
    $child.val(selected);
    changeClassForSelection($child, selected);
    cascadeSelectDown($child, selected);
  });
}

function cascadeUnselectUp($el, selected) {
  const $parent = parentOf($el, 'select');
  if (!$parent) { return; }
  $parent.val('ignored');
  changeClassForSelection($parent, 'ignored');
  cascadeUnselectUp($parent, selected);
}

function changeClassForSelection($selectTarget, selected) {
  const $icon = spanForSelect($selectTarget);
  const $styleDiv = styleDivForSelect($selectTarget);
  $styleDiv.attr('title', titleTextForOptionValue(selected));
  _.forEach($selectTarget.children(), (child) => {
    $icon.removeClass(iconClassForValue(child.value));
  });
  $icon.addClass(iconClassForValue(selected));
}

function titleTextForOptionValue(selectedValue) {
  switch (selectedValue) {
    case 'ignored':
      return $.t('screens.admin.connector.ignored_option');
    case 'data':
      return $.t('screens.admin.connector.data_option');
    case 'catalog':
      return $.t('screens.admin.connector.catalog_option');
    default:
      console.warn(`Unexpected value selection: ${selectedValue}, no title text found`);
      return '';
  }
}

function iconClassForValue(selectedValue) {
  switch (selectedValue) {
    case 'ignored':
      return 'icon-plus3';
    case 'data':
      return 'icon-data';
    case 'catalog':
      return 'icon-external-square';
    default:
      console.warn(`Unexpected value selection: ${selectedValue}, no icon found`);
      return '';
  }
}

function setConnectionStrategy() {
  return (event) => {
    const $target = $(event.currentTarget);
    const selectAllAssets = ($target.value() && $target.val() !== 'ignored');
    const setState = ($el) => ($el.attr('disabled', selectAllAssets));
    const setDisabledClass = ($el) => ($el[selectAllAssets ? 'addClass' : 'removeClass']('is-disabled'));

    // Esri use case
    setDisabledClass($('.select-style'));
    setDisabledClass($('.select-icon'));
    setState($('select.sync-type'));

    // Catalog Federator use case
    setState($('fieldset.line input[type=checkbox]'));
  };
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

function showFocusOnSelect(event) {
  const $target = $(event.currentTarget);
  const $styleDiv = $target.parent();
  $styleDiv.addClass('has-focus');
}

function removeFocusOnSelect(event) {
  const $target = $(event.currentTarget);
  const $styleDiv = $target.parent();
  $styleDiv.removeClass('has-focus');
}

$(() => {
  $('.filter-assets .searchBox').on('keyup', (event) => {
    const term = $(event.currentTarget).val().toLowerCase();
    let elements = $('select.sync-type');

    if (elements.length <= 0) {
      elements = $('.item.search-item');
    }
    elements.each((_index, el) => {
      const $el = $(el);
      const contents = filterAssets($el) || el.textContent;
      const $wrapper = $el.closest('.search-item');

      if (contents.toLowerCase().indexOf(term) === -1) {
        $wrapper.hide();
      } else {
        $wrapper.show();
      }
    });
  });

  $('.sync-type-select').focusin(showFocusOnSelect);
  $('.sync-type-select').focusout(removeFocusOnSelect);

  $('.sync-type-check').change(onChecked);
  $('.sync-type-select').change(onSelected);
  $('.server-sync').change(setConnectionStrategy());
});
