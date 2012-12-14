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
                                      var ea = $("#existingAPIs");
                                      ea.show();
                                      _.each(apis, function(api){
                                        var button = $('<a href="/api_foundry/manage/' + api.id + '"'
                                                      + ' class="manageapi toolbarButton button"'
                                                       +'> Manage API: ' + api.name + '</a>');
                                        ea.after(button);
                                      });
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
