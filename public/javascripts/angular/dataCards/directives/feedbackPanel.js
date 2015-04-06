(function() {
  'use strict';

  function feedbackPanel(ServerConfig) {
    return {
      restrict: 'E',
      scope: { },
      templateUrl: '/angular_templates/dataCards/feedbackPanel.html',
      link: function(scope, element) {

        if (ServerConfig.get('enableFeedback')) {

          scope.showFeedbackButton = true;
          scope.showFeedbackContent = false;

          scope.switchFeedbackInterfaceState = function(e) {
            // Don't dismiss the feedback panel when the user clicks on a link,
            // only when the user clicks on the panel itself.
            if (!e.target.hasOwnProperty('href')) {
              scope.showFeedbackButton = !scope.showFeedbackButton;
              scope.showFeedbackContent = !scope.showFeedbackContent;
            }
          };

          scope.includeScreenshot = function(e) {

            var usersnapConfig = {
              emailBox: true,
              emailRequired: false,
              commentBox: true,
              commentRequired: true,
              commentBoxPlaceholder: 'Please add comments here',
              customfields: [
                {
                  name: "type",
                  type: "select",
                  placeholder: "Feedback Type",
                  options: [
                    {
                      key: "I like this",
                      value: "I like this"
                    },
                    {
                      key: "I\'m missing a feature",
                      value: "I\'m missing a feature"
                    },
                    {
                      key: "Something seems broken",
                      value: "Something seems broken"
                    },
                    {
                      key: "Other",
                      value: "Other"
                    }
                  ],
                  required: true,
                  pos: 1
                }
              ]
            };

            var scriptContent = [
              '<script type="text/javascript">',
                '_usersnapconfig = {0};'.format(JSON.stringify(usersnapConfig)),
                '_usersnapconfig["loadHandler"] = function() { UserSnap.openReportWindow(); };',
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

            e.stopPropagation();

            $('head').append($(scriptContent));

            scope.showFeedbackContent = false;

          };

          scope.doNotIncludeScreenshot = function(e) {

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


            e.stopPropagation();

            $('head').append($(scriptContent));

            scope.showFeedbackContent = false;

          };

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
