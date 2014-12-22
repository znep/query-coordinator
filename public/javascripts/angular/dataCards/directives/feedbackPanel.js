(function() {
  'use strict';

  function feedbackPanel(ServerConfig) {
    return {
      restrict: 'E',
      scope: {
      },
      templateUrl: '/angular_templates/dataCards/feedbackPanel.html',
      link: function(scope, element) {

        var feedbackButton;
        var feedbackContent;
        var feedbackContentLinks;
        var includeScreenshotButton;
        var doNotIncludeScreenshotButton;

        if (ServerConfig.get('enableFeedback')) {

          feedbackButton = element.find('.feedback-panel-button');
          feedbackContent = element.find('.feedback-panel-content');
          feedbackContentLinks = element.find('.feedback-panel-content a');
          includeScreenshotButton = element.find('.include-screenshot');
          doNotIncludeScreenshotButton = element.find('.do-not-include-screenshot');

          feedbackButton.on('click', function() {
            feedbackButton.removeClass('active');
            feedbackContent.addClass('active');
          });

          feedbackContent.on('click', function() {
            feedbackContent.removeClass('active');
            feedbackButton.addClass('active');
          });

          feedbackContentLinks.on('click', function(e) {
            e.stopPropagation();
          });

          includeScreenshotButton.on('click', function(e) {
            var scriptContent = [
              '<script type="text/javascript">',
                '(function() {',
                  'var s = document.createElement("script");',
                  's.type = "text/javascript";',
                  's.async = true;',
                  's.src = "//api.usersnap.com/load/"+',
                          '"a2f75187-774f-4f2c-b4f0-bf5b52b39785.js";',
                  'var x = document.getElementsByTagName("script")[0];',
                  'x.parentNode.insertBefore(s, x);',
                '})();',
              '</script>'
            ].join('');

            $('head').append($(scriptContent));
            feedbackContent.removeClass('active');
            e.stopPropagation();
          });

          doNotIncludeScreenshotButton.on('click', function(e) {
            var scriptContent = [
              '<!-- Start of Zendesk Widget script -->',
              '<script>',
                'window.zEmbed||function(e,t){',
                  'var n,o,d,i,s,a=[],r=document.createElement("iframe");',
                  'window.zEmbed=function(){a.push(arguments)},',
                  'window.zE=window.zE||window.zEmbed,',
                  'r.src="javascript:false",',
                  'r.title="",',
                  'r.role="presentation",',
                  '(r.frameElement||r).style.cssText="display: none",',
                  'd=document.getElementsByTagName("script"),',
                  'd=d[d.length-1],',
                  'd.parentNode.insertBefore(r,d),',
                  'i=r.contentWindow,',
                  's=i.document;',
                  'try{',
                    'o=s',
                  '}catch(c){',
                    'n=document.domain,',
                    'r.src=\'javascript:var d=document.open();d.domain="\'+n+\'";void(0);\',',
                    'o=s',
                  '}',
                  'o.open()._l=function(){',
                    'var o=this.createElement("script");',
                    'n&&(this.domain=n),',
                    'o.id="js-iframe-async",',
                    'o.src=e,',
                    'this.t=+new Date,',
                    'this.zendeskHost=t,',
                    'this.zEQueue=a,',
                    'this.body.appendChild(o)',
                  '},',
                  'o.write(\'<body onload="document._l();">\'),',
                  'o.close()',
                '}("//assets.zendesk.com/embeddable_framework/main.js","socrata.zendesk.com");',
              '</script>',
              '<!-- End of Zendesk Widget script -->',
              '<script>',
                'zE(function(){',
                  'zE.activate();',  
                '});',
              '</script>'
            ].join('');

            $('head').append($(scriptContent));
            feedbackContent.removeClass('active');
            e.stopPropagation();
          });

        } else {

          element.remove();

        }

      }
    };
  }

  angular.
    module('dataCards.directives').
      directive('feedbackPanel', feedbackPanel);

})();
