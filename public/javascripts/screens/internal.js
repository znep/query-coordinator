;(function($) {
    var $domainCenter = $('.domainCompletion');
    var $youCompleteMe = $domainCenter.find('.domainAwesomeComplete');
    var $navContainer = $youCompleteMe.closest('.leftNavBox');
    var navWidth = $navContainer.width();

    $youCompleteMe.focus(_.once(function() {
      $domainCenter.addClass('loading');
      $.ajax({
        url: '/api/domains.json?method=all',
        success: function(domainList) {
          $domainCenter.removeClass('loading');
          $youCompleteMe.awesomecomplete({
              dontMatch: ['id', 'parentDomainId'],
              highlightMatches: true,
              ignoreCase: true,
              onComplete: completelyAwesome,
              staticData: domainList
          });
        }
      });
      $navContainer.animate({width: 250}, 200);
    }));
    var unslideNav = function() {
        $navContainer.animate({width: navWidth}, 200);
    };
    $youCompleteMe.blur(unslideNav);

    var completelyAwesome = function(domain) {
        unslideNav();
        var url = '/internal/orgs/' + domain.organizationId + '/domains/' +
                      domain.cname;
        window.location = url;
    };

    $domainCenter.find('ul').css('width', '90%');
})(jQuery);
