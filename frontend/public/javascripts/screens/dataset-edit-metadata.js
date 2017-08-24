$(function() {
  'use strict';

  // Validation
  var $form = $('#editMetadataForm');
  var rules = {};
  rules['view[name]'] = 'required';
  rules['view[attributionLink]'] = 'customUrl';
  rules['view[metadata[customRdfClass]]'] = {url: true};
  $form.find('.validateOptions select').each(function() {
    rules[$(this).name()] = 'validateOptions';
  });

  var messages = {};
  messages['view[name]'] = $.t('screens.edit_metadata.dataset_title_error');
  messages['view[attributionLink]'] = $.t('screens.edit_metadata.source_link_error');
  messages['view[metadata[customRdfClass]]'] = $.t('screens.edit_metadata.custom_error');
  $form.find('.validateOptions select').each(function() {
    var initialValue = $(this).find(':selected').text();
    messages[$(this).name()] = {
      validateOptions: $.t('screens.edit_metadata.option_unavailable', { value: initialValue })
    };
  });

  var $validator = $form.validate({
    rules: rules,
    messages: messages,
    errorPlacement: function(error, element) {
      switch (element.get(0).id) {
        case 'view_metadata_customRdfClass':
          // if rdf combo shows, we do not care about the hidden field
          if (element.is(':visible')) {
            error.appendTo(element.parent());
          }
          break;
        default:
          error.appendTo(element.closest('.line'));
      }
    }
  });

  $form.on('change', 'input, select', function() {
    $form.find('.submitButton').toggleClass('disabled', !$form.valid());
  });

  $('.toggleFieldsetLink').click(function(event) {
    event.preventDefault();
    $(event.target).
    toggleClass('expanded collapsed').
    closest('.customFieldsetWrapper').
    find('.customFieldset').
    slideToggle();
  });

  var $uploadLink = $.tag({
    tagName: 'a',
    'href': '#upload',
    contents: $.t('screens.edit_metadata.upload_new_attachment'),
    'class': 'button uploadLink'
  });

  $('#attachment_new').replaceWith($uploadLink);
  $('.newAttachmentLabel').html('&nbsp;');
  $('.attachments').attachmentsEditor();

  var initCustomRdf = function() {
    var $rdfClass = $form.find('#view_metadata_rdfClass');
    // non-tabular dataset, no rdf
    if ($rdfClass.length <= 0) {
      return;
    }

    var val = $form.find('#view_metadata_customRdfClass').val();
    var cboVal = $rdfClass.val();

    if (val != $.t('screens.edit_metadata.none') && !$.isBlank(val) && val != cboVal) {
      $form.find('.comboToggle').click();
    }
  };

  // rdfClass has 2 html input behind it - rdfClass and customRdfClass.
  // merge them into one - rdfClass to make downstream saving easy.
  var preSubmitCustomRdf = function() {
    var $customRdfClass = $form.find('#view_metadata_customRdfClass');
    var $rdfClass = $form.find('#view_metadata_rdfClass');
    var val;

    // non-tabular dataset, no rdf
    if ($rdfClass.length <= 0) {
      return;
    }

    if ($customRdfClass.is(':visible')) {
      if (!$validator.element($customRdfClass) && !$.isBlank($customRdfClass.val())) {
        // abort merging because customRdfClass is invalid url
        return;
      }

      if (!$form.valid()) {
        return;
      }
      val = $customRdfClass.val();
      $rdfClass.append($('<option/>').attr('value', val)).val(val);
    } else {
      $customRdfClass.val('');
      if (!$form.valid()) {
        return;
      }
    }

    // setting name to empty prevent customRdfClass from persisting to metadata.
    $customRdfClass.attr('name', '');
    if ($rdfClass.val().startsWith('_')) {
      // this clears meta.rdfClass when metadata persist
      $rdfClass.append($('<option/>').attr('value', '')).val('');
    }
  };

  // Now we're ready to uniform everything
  $('select').uniform();

  // Default submit button styling is really inconsistent
  $('.submitButton').
  hide().
  after($.tag({
    tagName: 'a',
    'class': 'button submitButton',
    contents: $.t('screens.edit_metadata.save'),
    title: $.t('screens.edit_metadata.save_changes'),
    href: '#submit'
  }));
  $('.submitButton').click(function(event) {
    event.preventDefault();
    if ($(this).is('.disabled')) {
      return;
    }
    preSubmitCustomRdf();
    if ($form.valid()) {
      $form.submit();
    }
  });

  $form.find('.submitButton').toggleClass('disabled', !$form.valid());


  $form.find('.comboToggle').click(function(event) {
    event.preventDefault();
    var $cbo = $(this).parent().find('.uniform');
    var $label = $(this).parent().find('label');

    if ($cbo.is(':visible')) {
      $label.attr('for', 'view_metadata_customRdfClass');
      $(this).find('a').text($.t('screens.edit_metadata.list'));
      $cbo.hide();
      var $txt = $cbo.next('input');
      if ($txt.val() == $.t('screens.edit_metadata.none')) {
        $txt.val('');
      }

      $txt.removeClass('hide');
      // revalidate custom rdf
      $validator.element($txt);
    } else {
      // custom rdf class is visible
      $label.attr('for', 'view_metadata_rdfClass');
      $(this).find('a').text($.t('screens.edit_metadata.custom'));
      $cbo.show();
      $cbo.next('input').addClass('hide');
      // hide custom rdf error
      $cbo.parent().find('label.error').hide();
    }
  });

  initCustomRdf();

  // Access points aka HREF aka external sources aka external datasets
  var updateRemoveLinks = function() {
    var $externalSources = $form.find('.externalSource');
    var sourceCount = $('.externalDatasetBox').find('.externalSource').length;
    if (sourceCount === 1) {
      $externalSources.
      find('.removeExternalSource').
      addClass('disabled');
    } else {
      $externalSources.
      find('.removeExternalSource').
      removeClass('disabled');
    }
  };
  updateRemoveLinks();

  $form.on('click', '.removeExternalSource', function(event) {
    event.preventDefault();
    if ($(this).hasClass('disabled')) {
      return;
    }

    if (confirm($.t('screens.edit_metadata.external_confirm'))) {
      var $line = $(this).closest('.line');
      $line.slideUp(300, function() {
        $line.remove();
        updateRemoveLinks();
      });
    }
  });

  $form.on('click', '.removeExternalLink', function(event) {
    event.preventDefault();
    if ($(this).hasClass('disabled')) {
      return;
    }

    if (confirm($.t('screens.edit_metadata.external_confirm'))) {
      var endpointCount = $(this).parent().siblings('.externalLink').length;
      var $externalLink = $(this).closest('.externalLink');

      if (endpointCount === 0) {
        $externalLink.find('input').val('');
      } else {
        $externalLink.slideUp(300, function() {
          $externalLink.remove();
          updateRemoveLinks();
        });
      }
    }
  });

  $form.on('click', '.addExternalSource', function(event) {
    event.preventDefault();
    var $clone = $('.externalSource').first().clone();
    // Clear cloned content and append to page
    $clone.find('.externalLink:not(:first)').remove();
    $clone.find('input, textarea').val('').text('');
    // Clear the prompt class, if present, to ensure data dictionary values are saved
    $clone.find('.prompt').removeClass('prompt');
    $clone.appendTo('.externalDatasetBox');
    updateRemoveLinks();
  });

  $form.on('click', '.addExternalLink', function(event) {
    event.preventDefault();
    var $line = $(this).closest('.line').clone(false);
    var $externalLinkBox = $(this).closest('.externalLinkBox');
    $line.find('input').attr('value', '');
    $externalLinkBox.find('.removeExternalSource').before($line);
  });


  $('.customImage #custom_image').imageUploader({
    $image: $('.customImageContainer'),
    success: function($container, $image, response) {
      $image.closest('.line').removeClass('hide');
      $('.iconUrlField').val('fileId:' + response.file);
    },
    urlProcessor: function(response) {
      if (!_.isEmpty(response.file)) {
        return '/api/views/' + blist.viewId + '/files/' + response.file + '?size=medium';
      } else {
        return '/api/assets/' + response.id + '?s=medium';
      }
    }
  });
  $('.customImage #delete_custom_image').uniform();
});
