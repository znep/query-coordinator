;(function($) {
  blist.namespace.fetch('blist.internal');

  blist.internal.fetchDomainList = function($element, options) {
    var staticOptions = {
      dontMatch: ['id', 'parentDomainId'],
      highlightMatches: true,
      ignoreCase: true,
      onComplete: options.onComplete,
      staticData: blist.internal.domains
    };

    if (_.isUndefined(staticOptions.staticData)) {
      $element.addClass('loading');
      $.ajax({
        url: '/internal/domains_summary.json',
        dataType: 'json',
        success: function(domainList) {
          blist.internal.domains = domainList;
          $.extend(staticOptions, { staticData: blist.internal.domains });
          $element.removeClass('loading');
          $element.find('input').awesomecomplete(staticOptions);
        }
      });
    } else {
      $element.find('input').awesomecomplete(staticOptions);
    }
  }

  var $domainCenter = $('.domainCompletion');
  var $youCompleteMe = $domainCenter.find('.domainAwesomeComplete');
  var $navContainer = $youCompleteMe.closest('.leftNavBox');
  var navWidth = $navContainer.width();

  $youCompleteMe.focus(function() {
    blist.internal.fetchDomainList($domainCenter, { onComplete: completelyAwesome });
    $navContainer.animate({width: 250}, 200);
  });
  var unslideNav = function() {
    $navContainer.animate({width: navWidth}, 200);
  };
  $youCompleteMe.blur(unslideNav);

  var completelyAwesome = function(domain) {
    unslideNav();
    var url = '/internal/orgs/{0}/domains/{1}'.format(domain.organizationId, domain.cname);
    window.location = url;
  };

  $domainCenter.find('ul').css('width', '90%');

  $('.expandable').each(function() {
    var $expandable = $(this);
    var $panel = $expandable.find('> div');
    $expandable.find('h2.headerLink').click(function(evt) {
      if (!$(evt.target).is('a')) {
        $(this).toggleClass('collapsed');
        $panel.toggleClass('collapsed');
      }
    });
  });

  $('input[name="domain[cName]"], input[name="new_cname"]').keydown(function() {
    var $this = $(this);
    // Copied from InternalController#valid_cname?
    var validCname = /^[a-zA-Z\d]+([a-zA-Z\d]+|\.(?!(\.|-|_))|-(?!(-|\.|_))|_(?!(_|\.|-)))*[a-zA-Z\d]+$/.test($this.val());
    if (!validCname) {
      $this.css('background-color', '#FF9494');
      // TODO: Should probably add an explanatory warning of some kind.
    } else {
      $this.css('background-color', 'white');
    }
  });

  if ($('body').is('action_internal_show_config')) {

  }
})(jQuery);
