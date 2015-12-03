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
        contentType: 'application/json',
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
})(jQuery);
