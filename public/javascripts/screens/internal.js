;(function($) {
    var $domainCenter = $('.domainCompletion');
    var $youCompleteMe = $domainCenter.find('.domainAwesomeComplete');
    var $navContainer = $youCompleteMe.closest('.leftNavBox');
    var navWidth = $navContainer.width();


    $youCompleteMe.focus(function() {
        $navContainer.animate({width: 250}, 200);
    });
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

    $youCompleteMe.awesomecomplete({
        dontMatch: ['id', 'parentDomainId'],
        highlightMatches: true,
        ignoreCase: true,
        onComplete: completelyAwesome,
        staticData: blist.internal.domains
    });

    $domainCenter.find('ul').css('width', '90%');
})(jQuery);
