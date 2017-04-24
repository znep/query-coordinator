/**
 * For 508 compliance, this page needs to render without javascript ;_;
 * The functionality here is non-essential, simply faciliating checkbox selection
 */

function parentOf($el, elementType) {
  const parentId = $el.data('parent-id');
  const parentType = $el.data('parent');
  if (!parentId || !parentType) { return false; }
  return $(`${elementType}[data-id="${parentId}"][data-type="${parentType}"]`);
}

// elementType: input for checkboxes or select for select tags
function childrenOf($el, elementType) {
  const id = $el.data('id');
  const type = $el.data('type');
  return $(`${elementType}[data-parent-id="${id}"][data-parent="${type}"]`);
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

function onRadioSelected(elementType) {
  return (event) => {
    const $target = $(event.currentTarget);
    const canSelectLayers = $target.value() && ($target.attr('value') !== 'ignored');
    const setState = ($el) => {
      $el[canSelectLayers ? 'attr' : 'removeAttr']('disabled', true);
    };

    // set or remove the is-disabled class on select-style divs and select-icon spans
    const setDisabledClass = ($el) => {
      $el[canSelectLayers ? 'addClass' : 'removeClass']('is-disabled');
    };
    $('.select-style').each((_index, el) => {
      setDisabledClass($(el));
    });

    $('.select-icon').each((_index, el) => {
      setDisabledClass($(el));
    });

    // Argh! because rails puts a bunch of hidden elements everywhere, we can't
    // just enable/disable the ones we know about, we have to get the hidden
    // ones as well, which have names that match the elements of .sync-type,
    // so we loop over all the visible ones and select the hidden ones
    // from the name of the visible ones ;_;
    $(`${elementType}.sync-type`).each((_index, el) => {
      const $visible = $(el);
      const name = $visible.attr('name');
      const $hidden = $(`${elementType}[name="${name}"`);
      setState($visible);
      setState($hidden);
    });
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

  const elementType = blist.feature_flags.enable_data_connector ? 'select' : 'input';

  $('.filter-assets .searchBox').on('keyup', (event) => {
    const term = $(event.currentTarget).val().toLowerCase();

    $(`${elementType}.sync-type`).each((_index, el) => {
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

  $('.sync-type-select').focusin(showFocusOnSelect);
  $('.sync-type-select').focusout(removeFocusOnSelect);

  $('.sync-type-check').change(onChecked);
  $('.sync-type-select').change(onSelected);
  $('.server-sync').change(onRadioSelected(elementType));
});
