/* eslint dot-location: 0 */

blist.namespace.fetch('blist.profile');

function newDatasetModal() {
  return $('.newDatasetModal');
}

(function($) {

  // var $feedContainer = $('.newsFeed .feed');

  // var renderFeed = function(views)
  // {
  //     // TODO: Hide spinner
  //     $feedContainer.feedList({
  //         allowComments: false,
  //         pageSize: 5,
  //         views: views
  //     });
  // };

  // // Render the feed template
  // $feedContainer.append(
  //     $.renderTemplate('feedList')
  //         // No commenting from the profile page
  //         .find('.feedNewCommentButton').remove()
  //         .end());

  // TODO: create/show spinner

  // Get the user's views for the news feed
  // TODO: Get activity on child views of their datasets?
  // TEMP: disable the feed until it's more interesting
  //   user.getDatasets(function(views)
  //   { renderFeed(views); });

  // Follow/unfollow a user
  $('.followButton').click(function(event) {
    event.preventDefault();
    var $link = $(event.target).closest('a'),
      newText = $.t('screens.profile.bar.follow_link'),
      origHref = $link.attr('href'),
      isCreate = false;

    if ($link.is('.add')) {
      newText = $.t('screens.profile.bar.unfollow_link');
      isCreate = true;
    }

    $.ajax({
      url: origHref,
      type: 'GET',
      success: function() {
        var newHref = isCreate ?
          origHref.replace('create', 'delete') :
          origHref.replace('delete', 'create');

        $link
          .find('.linkText')
          .text(newText)
          .end()
          .attr('href', newHref)
          .toggleClass('add remove');
      }
    });

  });

  $('.showMoreContacts').click(function(event) {
    event.preventDefault();
    var $link = $(event.target),
      expanded = $link.text() == $.t('screens.profile.sidebar.all_contacts_link'),
      newText = $.t('screens.profile.sidebar.' + (expanded ? 'hide' : 'all') + '_contacts_link');

    $link
      .text(newText)
      .closest('.userList')
      .find('.hiddenContacts')
      .slideToggle();
  });

  var $contactDialog = $('.contactUserDialog');
  var $contactForm = $contactDialog.find('form');
  var $contactError = $contactDialog.find('.mainError');
  var $mainFlash = $('.mainFlash .flash');
  $('.contactUserButton').click(function(event) {
    event.preventDefault();
    $contactForm[0].reset();
    $contactDialog.jqmShow();
  });
  $contactDialog.find('.submitAction').click(function(event) {
    event.preventDefault();

    $contactError.removeClass('error').text('');
    if (!$contactForm.valid()) {
      return;
    }

    $.socrataServer.makeRequest({
      type: 'POST',
      url: $contactForm.attr('action'),
      data: JSON.stringify($contactForm.serializeObject()),
      success: function() {
        $contactDialog.jqmHide();
        $mainFlash.text($.t('screens.profile.edit.account.email.send_success')).addClass('notice');
        setTimeout(function() {
          $mainFlash.fadeOut();
        }, 5000);
      },
      error: function() {
        $contactError
          .text($.t('screens.profile.edit.account.email.send_error'))
          .addClass('error');
      }
    });
  });
  $contactForm.validate();

  $('.button.createLink').click(function(event) {
    if (blist.feature_flags.ingress_reenter) {
      event.preventDefault();
      newDatasetModal().jqmShow();
    }
  });
  newDatasetModal().find('.submitButton').click(function() {
    newDatasetModal().find('form').submit();
  });

})(jQuery);

// mixpanel tracking for clicking "The latest from Socrata" links
$(window).load(function() {
  if (blist.mixpanelLoaded) {
    var mixpanelNS = blist.namespace.fetch('blist.mixpanel');

    mixpanelNS.delegateLinks('.whats-new--post-list--post', 'a', 'Clicked Socrata News Link');
  }

  if (blist.feature_flags.ingress_reenter && (window.location.hash === '#create_draft')) {
    newDatasetModal().jqmShow();
  }
});
