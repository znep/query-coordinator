(function($) {
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
      $element.find('input').attr('readonly', 'readonly');
      $.ajax({
        url: '/internal/domains_summary.json',
        dataType: 'json',
        success: function(domainList) {
          blist.internal.domains = domainList;
          $.extend(staticOptions, { staticData: blist.internal.domains });
          $element.removeClass('loading');
          $element.find('input').removeAttr('readonly');
          $element.find('input').awesomecomplete(staticOptions);
        }
      });
    } else {
      $element.find('input').awesomecomplete(staticOptions);
    }
  };

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

  $([ 'input[name="domain[cName]"]',
      'input[name="new_cname"]',
      'input[name="new_alias"]'
    ].join(', ')).keyup(_.debounce(function() {
    var $this = $(this),
        $cname = $this.val();
    var doesNotEndWithPunctuation = /[a-z]$/.test($cname);
    // Copied from InternalController#valid_cname?
    var cnameRegex = /^[a-zA-Z\d]+(?:[a-zA-Z\d]+|\.(?!(\.|-|_))|-(?!(-|\.|_))|_(?!(_|\.|-)))*[a-zA-Z\d]+$/;
    var validCname = _.isEmpty($cname) || (doesNotEndWithPunctuation && cnameRegex.test($cname));
    if (!validCname) {
      $this.css('background-color', '#FF9494');
      // TODO: Should probably add an explanatory warning of some kind.
    } else {
      $this.css('background-color', 'white');
    }
  }, 200));

  if ($('body').is('action_internal_show_config')) {

  }

  $.fn.formatWithMoment = function(format) {
    var text = this.text();
    var asMoment = moment(text);
    format = format || 'llll Z';

    if (asMoment.isValid()) {
      this.text(asMoment.format(format));
    }
  };
})(jQuery);
