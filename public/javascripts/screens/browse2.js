$(function() {
  'use strict';

  function doBrowse(newOpts) {
    // Reset page
    delete newOpts.page;
    // set utf8
    newOpts.utf8 = '%E2%9C%93';
    // Pull real URL from JS
    window.location = blist.browse.baseURL +
      '?' +
      _.map(
        newOpts,
        function(v, k) {

          if (_.isArray(v)) {
            return _.map(
              v,
              function(subvalue) {
                return k + '=' + subvalue;
              }
            ).join('&');
          }

          return k + '=' + v;
        }
      ).join('&');
  }

  function doSort() {
    _.defer(function() {
      var newOpts = $.extend({}, opts);

      newOpts.sortBy = $sortType.val();

      if ($sortType.find('option:selected').hasClass('timePeriod')) {
        newOpts.sortPeriod = $sortPeriod.val();
      } else {
        delete newOpts.sortPeriod;
      }

      doBrowse(newOpts);
    });
  }

  function hookSearch(event) {
    event.preventDefault();

    _.defer(function() {
      var newOpts = $.extend(
        {},
        opts,
        {
          q: encodeURIComponent(
            $searchSection.find('.browse2-search-control').val()
          )
        }
      );

      if ($.isBlank(newOpts.q)) {
        delete newOpts.q;
      } else {
        delete newOpts.sortPeriod;
        newOpts.sortBy = 'relevance';
      }

      if (!blist.mixpanelLoaded) {
        doBrowse(newOpts);
      } else {
        $.mixpanelMeta();
        mixpanel.track(
          "Used Search Field",
          {},
          function() {
            doBrowse(newOpts);
          }
        );
      }
    });
  }

  function linkify(extra) {
    var replacedText;
    var replacePattern1;
    var replacePattern2;
    var replacePattern3;

    if ($.isBlank(this)) {
      return '';
    }

    if ($.isBlank(extra)) {
      extra = '';
    }

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = this.replace(replacePattern1, '<a href="$1" '+extra+'>$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" '+extra+'>$2</a>');

    //Change email addresses to mailto:: links.
    replacePattern3 = /(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText;
  }

  function createNewStory(event) {
    event.preventDefault();
    event.stopPropagation();

    if (window.hasOwnProperty('blist') &&
      window.blist.hasOwnProperty('configuration') &&
      window.blist.configuration.hasOwnProperty('appToken')) {

      var $button = $(this);

      function onError(xhr, textStatus, error) {

        $button.attr('data-status', 'ready');

        alert('Oh no! There’s been a problem. Please try again.');
      }

      function onSuccess(data, textStatus, xhr) {

        function validate4x4(testString) {
          var valid = false;
          var pattern = window.blist.util.patterns.UID;

          if (pattern) {
            valid = testString.match(pattern) !== null;
          }

          return valid;
        }

        function onPublishSuccess(data, textStatus, xhr) {

          if (data.hasOwnProperty('id') && validate4x4(data.id)) {

            // This is the second phase of the creation action,
            // and this endpoint is responsible for removing the
            // '"initialized": false' flag (or setting it to true)
            // when it succeeds at creating the new story objects
            // in Storyteller's datastore.
            //
            // This isn't perfect but it should (hopefully) be
            // reliable enough that users will not totally fail to
            // create stories when they intend to do so.
            window.location.href = '/stories/s/{0}/create'.format(data.id);

          } else {
            onError();
          }
        }

        if (data.hasOwnProperty('id') && validate4x4(data.id)) {
          // Next we need to publish the newly-created catalog
          // asset, since the publish action provisions a new
          // 4x4.
          var publishUrl = '/api/views/{0}/publication.json?accessType=WEBSITE'.format(data.id);
          var publishSettings = {
            contentType: false,
            error: onError,
            headers: {
              'X-App-Token': blist.configuration.appToken
            },
            type: 'POST',
            success: onPublishSuccess
          };

          $.ajax(publishUrl, publishSettings);

        } else {
          onError(xhr, 'Invalid storyUid', 'Invalid storyUid');
        }
      }

      var newStoryName = 'Untitled Story - {0}'.format(new Date().format('m-d-Y'));

      var newStoryData = {
        name: newStoryName,
        metadata: {
          renderTypeConfig: {
            visible: {
              href: true
            }
          },
          accessPoints: {
            // This will be replaced with the actual resource
            // url when the view metadata is updated by the Stories
            // application.
            story: 'https://www.socrata.com/'
          },
          availableDisplayTypes: ['story'],
          jsonQuery: {},
          // Since Storyteller has its own datastore, we will
          // need to treat this asynchonously. Tagging the
          // metadata with '"initialized": false' should at least
          // allow us to understand how many of the two-phase
          // story creation actions fail, and should also allow
          // us to do some garbage collection down the road.
          initialized: false
        },
        displayType: 'story',
        displayFormat: {},
        query: {}
      };

      var url = '/api/views.json';
      var settings = {
        contentType: false,
        data: JSON.stringify(newStoryData),
        dataType: 'json',
        error: onError,
        headers: {
          'Content-type': 'application/json',
          'X-App-Token': blist.configuration.appToken
        },
        type: 'POST',
        success: onSuccess
      };

      $button.attr('data-status', 'busy');
      $.ajax(url, settings);
    }
  }

  function toggleBrowse2CreateAssetDisplay(event) {
    var sectionContainer = $(this).parent('.browse2-create-asset');
    var currentDisplay = sectionContainer.attr('data-panel-display');

    if (currentDisplay === 'show') {
      sectionContainer.attr('data-panel-display', 'hide');
      $(this).blur();
    } else {
      sectionContainer.attr('data-panel-display', 'show');
    }
  }

  function toggleBrowse2FacetDisplay(event) {
    var sectionContainer = $(this).parent('.browse2-facet-section');
    var currentDisplay = sectionContainer.attr('data-facet-display');

    if (currentDisplay === 'show') {
      sectionContainer.attr('data-facet-display', 'hide');
    } else {
      sectionContainer.attr('data-facet-display', 'show');
    }
  }

  function toggleBrowse2FacetDisplay(event) {
    var sectionContainer = $(this).parent('.browse2-facet-section');
    var currentDisplay = sectionContainer.attr('data-facet-display');

    if (currentDisplay === 'show') {
      sectionContainer.attr('data-facet-display', 'hide');
    } else {
      sectionContainer.attr('data-facet-display', 'show');
    }
  }

  function toggleBrowse2FacetTruncation(event) {
    var sectionContainer = $(this).parent('.browse2-facet-section');
    var currentDisplay = sectionContainer.attr('data-facet-truncation');

    if (currentDisplay === 'show') {
      sectionContainer.attr('data-facet-truncation', 'truncate');
    } else {
      sectionContainer.attr('data-facet-truncation', 'show');
    }
  }

  function toggleBrowse2DescriptionTruncation(event) {
    var sectionContainer = $(this).parent('.browse2-result-description-container');
    var currentDisplay = sectionContainer.attr('data-description-display');

    if (currentDisplay === 'show') {
      sectionContainer.attr('data-description-display', 'truncate');
    } else {
      sectionContainer.attr('data-description-display', 'show');
    }
  }

  function makeResultPublic(event) {
    var id = $(event.target).closest('[data-result-id]').attr('data-result-id');
    var dataset;
    var url = '/views/{0}.json?accessType=WEBSITE&method=setPermission&value=public.read'.format(id);
    var makePublicSettings;

    function onMakePublicSuccess() {
      window.location.href = window.location.href;
    }

    function onMakePublicError() {
      alert(
        $.t('controls.browse.browse2.edit.make_public.error', { dataset: dataset.name })
      );
    }

    if (!(blist.browse.datasets[id] instanceof Dataset)) {
      blist.browse.datasets[id] = new Dataset(blist.browse.datasets[id]);
    }

    dataset = blist.browse.datasets[id];

    makePublicSettings = {
      contentType: false,
      error: onMakePublicError,
      headers: {
        'X-App-Token': blist.configuration.appToken
      },
      type: 'PUT',
      success: onMakePublicSuccess
    };

    $.ajax(url, makePublicSettings);
  }

  function makeResultPrivate(event) {
    var id = $(event.target).closest('[data-result-id]').attr('data-result-id');
    var dataset;
    var url = '/views/{0}.json?accessType=WEBSITE&method=setPermission&value=private'.format(id);
    var makePrivateSettings;

    function onMakePrivateSuccess() {
      window.location.href = window.location.href;
    }

    function onMakePrivateError() {
      alert(
        $.t('controls.browse.browse2.edit.make_private.error', { dataset: dataset.name })
      );
    }

    if (!(blist.browse.datasets[id] instanceof Dataset)) {
      blist.browse.datasets[id] = new Dataset(blist.browse.datasets[id]);
    }

    dataset = blist.browse.datasets[id];

    makePrivateSettings = {
      contentType: false,
      error: onMakePrivateError,
      headers: {
        'X-App-Token': blist.configuration.appToken
      },
      type: 'PUT',
      success: onMakePrivateSuccess
    };

    $.ajax(url, makePrivateSettings);
  }

  function deleteResult(event) {
    var id = $(event.target).closest('[data-result-id]').attr('data-result-id');
    var dataset;
    var url;
    var deleteSettings;

    function onDeleteSuccess() {
      window.location.href = window.location.href;
    }

    function onDeleteError() {
      alert(
        $.t('controls.browse.browse2.edit.delete.error', { dataset: dataset.name })
      );
    }

    if (!(blist.browse.datasets[id] instanceof Dataset)) {
      blist.browse.datasets[id] = new Dataset(blist.browse.datasets[id]);
    }

    dataset = blist.browse.datasets[id];

    if (dataset.isNewView() || dataset.isDataLens()) {
      // Send a DELETE request to the NFE endpoint, which should propagate the delete to the
      // OBE representation.
      url = '/metadata/v1/page/{0}'.format(id); 
    } else {
      url = '/api/views/{0}.json'.format(id);
    }

    deleteSettings = {
      contentType: false,
      error: onDeleteError,
      headers: {
        'X-App-Token': blist.configuration.appToken
      },
      type: 'DELETE',
      success: onDeleteSuccess
    };

    if (confirm($.t('controls.browse.browse2.edit.delete.confirm', { dataset: dataset.name }))) {
      $.ajax(url, deleteSettings);
    }
  }

  var $browse = $('.browse2');
  // alias this method so external scripts can get at it
  var getDS = blist.browse.getDS = function($item, browseType) {
    var id = $item.closest('.browse2-result').attr('data-view-id');

    if (!(blist.browse.datasets[id] instanceof Dataset)) {
      blist.browse.datasets[id] = new Dataset(blist.browse.datasets[id]);
    }

    return blist.browse.datasets[id];
  };
  var opts = {};
  var $sortType = $('#browse2-sort-type');
  var $sortPeriod = $('#browse2-sort-period');
  var searchRegex = '';
  var $searchSection = $browse.find('.browse2-search');

  if (!$.isBlank(window.location.search)) {
    _.each(
      window.location.search.slice(1).split('&'),
      function(p) {
        var s = p.split('=');

        s[0] = unescape(s[0]);

        if (/\[\]$/.test(s[0])) {
          if ($.isBlank(opts[s[0]])) {
            opts[s[0]] = [];
          }

          opts[s[0]].push(s[1])
        } else {
          opts[s[0]] = s[1];
        }
      }
    );
  }

  // Sad hack: we don't have the stemmed version, so just highlight the words they typed.
  // Also remove special characters because they can break the regex.
  if ($.subKeyDefined(blist, 'browse.searchOptions.q')) {
    searchRegex = new RegExp(
      blist.
        browse.
        searchOptions.
        q.
        trim().
        replace(/[^\w\s]/gi, '').
        replace(' ', '|'),
      'gi'
    );
  }

  if (!$.isBlank(searchRegex)) {
    // Assuming that dataset names do not have any html inside them.
    // Assuming that dataset descriptions only have A tags inside them.
    $("table tbody tr").
      find("a.name, span.name, div.description, span.category, span.tags").
      each(function() {
        var $this = $(this);
        var a_links = $this.
          children().
          map(function() {
            var $child = $(this);

            $child.html(
              $child.
                html()
                .replace(searchRegex, '<span class="highlight">$&</span>')
            );

            return $child[0].outerHTML;
          });
        var text_bits = _.map(
          $this.html().split(/<a.*\/a>/),
          function(text) {
            return text.replace(searchRegex, '<span class="highlight">$&</span>');
          }
        );

        $this.html(_.flatten(_.zip(text_bits, a_links)).join(''));
      });

    $('.browse-list-item').
      find('[data-search="highlight"]').
      find('*').
      addBack().
      contents().
      filter(function() {
        return this.nodeType === 3;
      }).
      each(function() {
        var newContent = $(this).text().replace(searchRegex,'<span class="highlight">$&</span>');

        $(this).replaceWith(newContent);
      });
  }

  if ($searchSection.length > 0) {
    $searchSection.submit(hookSearch).children('.icon').click(hookSearch);
  }

  $sortType.on('change', doSort);
  $sortPeriod.on('change', doSort);

  $.live(
    'a[rel*=externalDomain]',
    'click',
    function(event) {
      event.preventDefault();

      var $a = $(this);
      var ds = getDS($a);
      var href = $a.attr('href');
      var description = ds.description || '';
      var $modal = $('.externalDomainNotice');

      if (description.length > 128) {
        description = description.substring(0, 128) + '...';
      }

      description = linkify($.htmlEscape(description), 'rel="nofollow"');

      $modal.
        find('.leavingLink').
        attr('href', href).
        text(href);

      $modal.
        find('.accept.button').
        attr('href', href);

      $modal.
        find('.datasetType').
        text(ds.displayName);

      $modal.
        find('.externalDomain').
        attr('href', ds.domainUrl).
        text(ds.domainCName);

      $modal.
        find('.browse2-external-link-title').
        text(ds.name).
        end().
        find('.browse2-external-link-description').
        html(description);

      $modal.jqmShow();
    }
  );

  // blist.iframeHack belongs in the parent window and listens for a modifier key.
  if (window != window.parent &&
      window.parent.blist &&
      window.parent.blist.iframeHack) {

    $browse.on(
      'click',
      'a[rel=external]',
      function(event) {

        if (!window.parent.blist.iframeHack.isModified()) {
          event.preventDefault();
          event.stopPropagation();

          window.parent.location = $(this).attr('href');
        }
      }
    );
  }

  $.live(
    '#create-story-button',
    'click',
    createNewStory
  );

  $('.browse2-create-asset-button').on('click', toggleBrowse2CreateAssetDisplay);
  $('.browse2-facet-section-title').on('click', toggleBrowse2FacetDisplay);
  $('.browse2-facet-section-expand-button, .browse2-facet-section-contract-button').on('click', toggleBrowse2FacetTruncation);
  $('.browse2-result-description-truncation-toggle-control').on('click', toggleBrowse2DescriptionTruncation);
  $('.browse2-result-description').each(function(index, element) {
    // 3x the CSS line-height (24px) for description <div>s and <p>s + 10px for padding
    var truncationThreshold = 82;
    var descriptionHeight = 0;

    $(element).
      children().
      each(function(index, childElement) {
        descriptionHeight += $(childElement).outerHeight(true);
      });

    if (descriptionHeight >= truncationThreshold) {
      $(element).
        parent('.browse2-result-description-container').
        attr('data-description-display', 'truncate');
    }
  });
  $('.browse2-result-make-public-button').on('click', makeResultPublic);
  $('.browse2-result-make-private-button').on('click', makeResultPrivate);
  $('.browse2-result-delete-button').on('click', deleteResult);
});
