(function($)
{
    $.Control.extend('pane_api_foundry', {
        getTitle: function()
        { return 'APIs'; },

        getSubtitle: function()
        { return 'Create and Customize an API'; },

        _getSections: function()
        {
            return [
                {
                    customContent: {
                        template: 'apiFoundryPaneWrapper',
                        directive: {
                            'p@class+': 'pClass'
                        },
                        data: { pClass: 'sectionContent' },
                        callback: function($s)
                        {
                            var cpObj = this;
                            cpObj._startProcessing();
                            cpObj._$section = $s;
                            cpObj._view.getRelatedViews(
                                function(v)
                                {
                                    cpObj._finishProcessing();
                                    cpObj._viewList = v;
                                    var apis = _.filter(v, function(view){return view.displayName === "API";});
                                    if (apis.length > 0){
                                      var $s = $('#selectAPI'), options = [], $ea = $("#existingAPIs");
                                      $s.empty();
                                      _.each(apis, function(api){
                                        $s.append($.tag({tagName:'option', value:api.id, contents:$.htmlEscape(api.name)}));
                                      });
                                      if ($.uniform){
                                        $.uniform.update($s);
                                      }
                                      $(".manageAPI").click(function(event){
                                        window.location.href='/api_foundry/manage/' + $s.value();
                                      });
                                      $ea.show();
                                    }
                                });
                        }
                    }
                }
            ];
        }
    }, {name: 'apiFoundry'}, 'controlPane');

    if ($.isBlank(blist.sidebarHidden.manage) || !blist.sidebarHidden.manage.api_foundry)
    { $.gridSidebar.registerConfig('manage.api_foundry', 'pane_api_foundry', 8); }

})(jQuery);
