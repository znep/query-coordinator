// Using the plugin pattern from Mike Alsup. 
// http://www.learningjquery.com/2007/10/a-plugin-development-pattern
// Author: pete.stuart@blist.com

// Protect $.
(function($) {

    // Highlight list items in the expanded info pane on hover.
    $.fn.infoPaneItemHighlight = function(options) {
        var opts = $.extend({}, $.fn.infoPaneItemHighlight.defaults, options);

        return this.each(function() {
            var $this = $(this);

            // Support for the Metadata Plugin.
            var o = $.meta ? $.extend({}, opts, $this.data()) : opts;

            // Wire up hover on the dt.
            $this.find("dt").hover(
                function()
                {
                    if (!$(this).parents(".infoContentOuter").is(".multiInfoSummary"))
                    {
                        $(this).parent().find("dd").addClass("hover");
                    }
                    $(this).addClass("hover");
                },
                function()
                {
                    if (!$(this).parents(".infoContentOuter").is(".multiInfoSummary"))
                    {
                        $(this).parent().find("dd").removeClass("hover");
                    }
                    $(this).removeClass("hover");
                }
            );

            $this.find("dd").hover(
                function()
                {
                    $(this).parent().find("dt").addClass("hover");
                    $(this).addClass("hover");
                },
                function()
                {
                    $(this).parent().find("dt").removeClass("hover");
                    $(this).removeClass("hover");
                }
            );

            $this.find(".panelHeader.editItem").hover(
                function()
                {
                    $(this).addClass("hover");
                },
                function()
                {
                    $(this).removeClass("hover");
                }
            );

            $this.find(opts.clickSelector).click(function(event)
            {
                var $this = $(this);
                if ($(event.target).is('a'))
                {
                    return;
                }
                event.preventDefault();

                // Walk up to the container, down to the actions.
                $this.closest(opts.itemContainerSelector)
                        .find(opts.actionSelector)
                        .trigger("click");
            });

            $this.find('.comboToggle').click(function(event)
            {
                event.preventDefault();
                var $cbo = $(this).parent().find('select');

                if ($cbo.is(':visible'))
                {
                    $(this).find('a').text('List');
                    $cbo.hide();
                    $cbo.next('input').removeClass('hide');
                }
                else
                {
                    $(this).find('a').text('Custom');
                    $cbo.show();
                    $cbo.next('input').addClass('hide');
                    $(this).closest('form').data('validator').resetForm();
                }
            });
        });
    };

    // default options
    $.fn.infoPaneItemHighlight.defaults = {
        itemContainerSelector: "dd, .editItem",
        clickSelector: ".itemContent > *:not(form)",
        actionSelector: ".itemActions > a"
    };



    $.fn.infoPaneItemEdit = function(options) {
        var opts = $.extend({}, $.fn.infoPaneItemEdit.defaults, options);

        // Private methods
        function editClick(event)
        {
            event.preventDefault();
            var $this = $(this);

            // Hide all forms, show all spans.
            closeAllForms();

            var $currentItemContainer = $this.closest(opts.containerSelector)
                .find(opts.itemContentSelector);
            $currentItemContainer.find("span").hide();
            var $form = $currentItemContainer.find("form").keyup(function(event)
            {
                if (event.keyCode == 27)
                {
                    closeAllForms();
                }
            });
            $form.show().find("input[type='text']").focus().select();

            // Combo which can be take custom value is followed by textbox followed by toggle button.
            // We hide combo and show textbox if value is not in combo
            var fieldType = $form.find("input[name='fieldType']").val();
            var selector = ":input[name*='" + fieldType + "']";
            var $valEl = $form.find(selector);
            if ($valEl.get(0).tagName == "SELECT" && $valEl.attr('hasCustomEdit') != undefined)
            {
                var spanVal = $currentItemContainer.find("span").text().trim();
                if (!$.isBlank(spanVal) && spanVal != $valEl.find(':selected').text())
                {
                    hideComboShowEdit($valEl);
                }
            }
        };

        function hideComboShowEdit($valEl)
        {
            if (!$valEl.is(':visible')) {return;}
            $valEl.parent().find('.comboToggle').click();
        };

        function closeAllForms()
        {
            var $allItemContainers = $(opts.allItemSelector);
            $allItemContainers.each(function(i, item)
            {
                var $item = $(item);

                var $oldTextEl = $item.find('span');

                // if you want to display label and store key/id,
                // you may put the id in the key attribute.
                // The display value is put in the span.
                var oldText = $oldTextEl.text();
                if ($oldTextEl.attr('key') != undefined)
                {
                    oldText = $oldTextEl.attr('key');
                }

                var $form = $item.find("form").hide();
                var fieldType = $form.find("input[name='fieldType']").val();
                $form.find(":input[name*='" + fieldType + "']").val(oldText);
                $item.find("span").show();
                var $validator = $form.data('validator');
                if ($validator)
                {
                    $validator.resetForm();
                }
            });
        };

        function editSubmit(event)
        {
            event.preventDefault();
            var $form = $(this);

            var fieldType = $form.find("input[name='fieldType']").val();
            var fieldValue = $form.find(":input[name*='" + fieldType + "']").val();

            var metaMatched = fieldType.match("metadata\\[(\\S*)\\]");
            if (metaMatched)
            {
                editSubmitMetadata($form, metaMatched)
                return;
            }


            $.ajax({
                url: $form.attr("action"),
                type: "PUT",
                data: $form.find(":input"),
                dataType: "json",
                success: function(responseData)
                {
                    if (responseData.error !== undefined &&
                        responseData.error !== null)
                    {
                        opts.submitErrorCallback(fieldType, responseData.error);
                    }
                    else
                    {
                        $form.hide();
                        $form.closest(opts.itemContentSelector)
                            .find("span").text(fieldValue).show();
                        opts.submitSuccessCallback(fieldType, fieldValue,
                            responseData.id, responseData);
                    }
                },
                error: function(request, textStatus, errorThrown)
                {
                    opts.submitErrorCallback(fieldType,
                            JSON.parse(request.responseText).message);
                }
            });
        };

        function editSubmitMetadata($form, metaMatched)
        {
            // if there is validator, check it.
            var $validator = $form.data('validator');
            if ($validator && !$validator.valid())
            {
                return;
            }

            var fieldType = $form.find("input[name='fieldType']").val();
            var selector = ":input[name*='" + fieldType + "']";
            var $valEl = $form.find(selector);
            var fieldValue = $valEl.val();
            // displayValue will be empty selector returns nothing
            var displayValue = $(selector + ' :selected').text();

            // handle fields that are stored under the lenses.metadata as direct and well know children.
            // Initially, there is rdfClass, rdfSubject
            var payload;

            var metadata = JSON.parse($($.fn.customFieldEdit.defaults.viewMetadataSelector).val()) || {};
            // combo that allow custom value is invisible, use custom textbox value.
            if (!$valEl.is(':visible'))
            {
                fieldValue = $valEl.next('input').val();
                displayValue = fieldValue;
            }

            metadata[metaMatched[1]] = fieldValue; // metaMatch[1] holds the name of the field under metadata from regex
            payload = JSON.stringify({metadata: metadata});

            $.ajax({
                url: $form.attr("action"),
                type: "PUT",
                data: payload,
                dataType: "json",
                contentType: 'application/json',
                success: function(responseData)
                {
                    if (responseData.error !== undefined &&
                        responseData.error !== null)
                    {
                        opts.submitErrorCallback(fieldType, responseData.error);
                    }
                    else
                    {
                        $form.hide();

                        var $span = $form.closest(opts.itemContentSelector).find("span");

                        $span.text(displayValue).show();

                        // combo box which has key and value needs to copy the new id to key attr
                        if ($span.attr('key') != undefined)
                        {
                            $span.attr('key', fieldValue);
                        }

                        // also save the combo value to the hidden custom textbox
                        if ($valEl.get(0).tagName == "SELECT" && $valEl.attr('hasCustomEdit') != undefined)
                        {
                            $valEl.next('input').val(displayValue);
                        }


                        $($.fn.customFieldEdit.defaults.viewMetadataSelector).val(JSON.stringify(metadata));

                        opts.submitSuccessCallback(fieldType, fieldValue, responseData.id, responseData);
                    }
                },
                error: function(request, textStatus, errorThrown)
                {
                    opts.submitErrorCallback(fieldType,
                            JSON.parse(request.responseText).message);
                }
            });
        };

        function editCancel(event)
        {
            event.preventDefault();
            closeAllForms();
        };
        
        return this.each(function() {
            var $dd = $(this);

            // Support for the Metadata Plugin.
            var o = $.meta ? $.extend({}, opts, $this.data()) : opts;

            // Wire up the events.
            $dd.find(opts.editClickSelector).click(editClick);
            $dd.find(opts.editSubmitSelector).submit(editSubmit);
            $dd.find(opts.editCancelSelector).click(editCancel);
        });
    };

     // default options
     $.fn.infoPaneItemEdit.defaults = {
       containerSelector: '.editItem',
       editClickSelector: ".itemActions .editLink",
       editSubmitSelector: ".itemContent form",
       editCancelSelector: ".itemContent form .formCancelLink",
       allItemSelector: "#infoPane .summaryList dd .itemContent, #infoPane .panelHeader.editItem .itemContent",
       itemContentSelector: ".itemContent",
       submitSuccessCallback: function(){},
       submitErrorCallback: function(){}
     };



    $.fn.infoPaneNavigate = function(options) {
        if (this.length < 1)
        {
            return false;
        }

        // check if a navigator for this list was already created
        var tabNavigator = $(this[0]).data("tabNavigator");
                if (tabNavigator) {
                    return tabNavigator;
                }

                tabNavigator = new $.infoPaneTabNavigator( options, this[0] );
                $(this[0]).data("tabNavigator", tabNavigator);

                return tabNavigator;
    };

    $.infoPaneTabNavigator = function(options, list) {
        this.settings = $.extend({}, $.infoPaneTabNavigator.defaults, options);
        this.currentList = list;
        this.init();
    };
    $.extend($.infoPaneTabNavigator, {
        defaults: {
            containerSelector : ".metadataPane",
            activationClass : "active",
            expanderSelector : ".expander",
            expandedClass : "expanded",
            tabSelector: "li",
            tabMap: {
                "tabSummary" : ".singleInfoSummary",
                "tabFiltered" : ".singleInfoFiltered",
                "tabComments" : ".singleInfoComments",
                "tabSharing" : ".singleInfoSharing",
                "tabPublishing" : ".singleInfoPublishing",
                "tabActivity" : ".singleInfoActivity"
            },
            allPanelsSelector : ".infoContentOuter",
            allPanelsHeaderSelector: ".infoContentHeader",
            expandableSelector: ".infoContent",
            expandableContainerSelector: ".infoContentWrapper",
            switchCompleteCallback: function(){},
            initialTab: '',
            isWidget: false,
            scrollToTabOnActivate: true,
            widgetMetaContainerSelector: "#widgetMeta",
            widgetMetaSuperHeaderSelector: "#widgetMeta .superHeader",
            widgetMetaHeaderSelector: "#widgetMeta .header",
            widgetOuterContainerSelector: ".gridInner", 
            initialMetaHeight: 0
        },
        prototype: {
            init: function() {
                var tabNavigator = this;
                // Set the expanded state.
                var isExpanded = $(tabNavigator.currentList)
                    .find(tabNavigator.settings.expanderSelector)
                    .is("." + tabNavigator.settings.expandedClass);
                $(tabNavigator.currentList).data("isExpanded", isExpanded);
                // Enumerate the tabs..
                $(tabNavigator.currentList)
                    .find(tabNavigator.settings.tabSelector).each(function()
                {
                    $li = $(this);
                    // Wire up the click event for the tab & expander arrow.
                    $li.find('a')
                        .click(function(event)
                    {
                        var $link = $(this);
                        var $tab = $link
                            .closest(tabNavigator.settings.tabSelector);
                        event.preventDefault();
                        if (tabNavigator.settings.isWidget)
                        {
                            tabNavigator.toggleWidgetTabPanels(function()
                                {tabNavigator.activateTab($tab);},
                                $tab.is("." +
                                    tabNavigator.settings.activationClass) ?
                                        undefined : true);
                        }
                        else
                        {
                            tabNavigator.toggleTabPanels(function()
                                {tabNavigator.activateTab($tab);},
                                $tab.is("." +
                                    tabNavigator.settings.activationClass) ?
                                        undefined : true);
                        }
                    });
                });

                if (tabNavigator.settings.initialTab &&
                    tabNavigator.settings.initialTab !== '')
                {
                    if ($(tabNavigator.currentList).data("isExpanded"))
                    {
                        tabNavigator.activateTab('#' +
                            tabNavigator.settings.initialTab);
                    }
                    else
                    {
                        tabNavigator.expandTabPanels(function ()
                        {
                            tabNavigator.activateTab('#' +
                                tabNavigator.settings.initialTab);
                        });
                    }
                }

                var $metaContainer =
                    $(tabNavigator.settings.widgetMetaContainerSelector);
                if ($metaContainer)
                {
                    tabNavigator.settings.initialMetaHeight =
                        $metaContainer.height();
                }

                $(tabNavigator.settings.widgetMetaSuperHeaderSelector)
                    .find("a").click(function(event)
                {
                    event.preventDefault();
                    tabNavigator.toggleWidgetTabPanels();
                });
            },
            activateTab: function(tab, preventExpansion)
            {
                var tabNavigator = this;
                var $tab = $(tab);
                var $tabLink = $tab.find("a:not(" +
                    tabNavigator.settings.expanderSelector + ")");
                var $panel = $(tabNavigator.currentList)
                                .closest(tabNavigator.settings.containerSelector)
                                .find(tabNavigator.settings.tabMap[$tab.attr("id")]);

                $(tabNavigator.currentList)
                    .find(tabNavigator.settings.tabSelector)
                    .removeClass(tabNavigator.settings.activationClass);
                $tab.addClass(tabNavigator.settings.activationClass);

                $panel.closest(tabNavigator.settings.containerSelector)
                    .find(tabNavigator.settings.allPanelsSelector)
                    .removeClass(tabNavigator.settings.activationClass);

                $panel.addClass(tabNavigator.settings.activationClass);

                tabNavigator.settings.switchCompleteCallback($tab);
                if (tabNavigator.settings.scrollToTabOnActivate)
                {
                    $tab[0].scrollIntoView();
                }
            },

            expandTabPanels: function(openCallback)
            {
                this.toggleTabPanels(openCallback, true);
            },

            toggleTabPanels: function(openCallback, open)
            {

                var tabNavigator = this;

                // Toggle all arrows.
                var $container = $(tabNavigator.currentList)
                    .closest(tabNavigator.settings.containerSelector);
                var $allExpanders = $(tabNavigator.currentList)
                    .find(tabNavigator.settings.expanderSelector);

                $allExpanders.toggleClass
                    (tabNavigator.settings.expandedClass, open);

                if ($(tabNavigator.currentList).data("isExpanded") &&
                    open !== true || open === false)
                {
                    $allExpanders.attr("title", "more info").text("more info");
                    $container.find(tabNavigator.settings.expandableSelector)
                        .each(function()
                    {
                        if ($(this).is(":visible"))
                        {
                            $(this).slideUp("fast", function() {
                                tabNavigator.settings.switchCompleteCallback();
                            });
                        }
                        else
                        {
                            $(this).hide();
                        }
                    });
                    $(tabNavigator.currentList).data("isExpanded", false);
                }
                else
                {
                    $allExpanders.attr("title", "less info").text("less info");
                    $container.find(tabNavigator.settings.expandableSelector)
                        .slideDown("fast", function()
                    {
                        tabNavigator.settings.switchCompleteCallback();
                        if (openCallback !== undefined)
                        {
                            openCallback();
                        }
                    });
                    $(tabNavigator.currentList).data("isExpanded", true);
                }

                // Set/Toggle all panels.
                $container.find(tabNavigator.settings.allPanelsSelector)
                            .toggleClass(tabNavigator.settings.expandedClass, open);
            },

            toggleWidgetTabPanels: function(openCallback, open)
            {
                var tabNavigator = this;

                // Toggle all arrows.
                var $allExpanders = $(tabNavigator.currentList)
                    .find(tabNavigator.settings.expanderSelector);
                $allExpanders.toggleClass
                    (tabNavigator.settings.expandedClass, open);

                var $container = $(tabNavigator.currentList)
                    .closest(tabNavigator.settings.containerSelector);
                var $metaContainer =
                    $(tabNavigator.settings.widgetMetaContainerSelector);

                if ($(tabNavigator.currentList).data("isExpanded") &&
                    open !== true || open === false)
                {
                    $allExpanders.attr("title", "more info").text("more info");

                    var metaPosition = $metaContainer.height() -
                        tabNavigator.settings.initialMetaHeight;
                    $metaContainer.animate(
                        {top: metaPosition + "px"},
                        function()
                        {
                            $metaContainer.removeClass("expanded").height("");
                            $container.find(tabNavigator.settings
                                .expandableContainerSelector).css("min-height", "");
                            $container.find(tabNavigator.settings
                                .expandableSelector).each(function()
                            {
                                $(this).hide();
                            });
                            tabNavigator.settings.switchCompleteCallback();
                        }
                    );

                    $(tabNavigator.currentList).data("isExpanded", false);
                }
                else
                {
                    $allExpanders.attr("title", "less info").text("less info");

                    var expandMinHeight =
                        $(tabNavigator.settings.widgetOuterContainerSelector)
                            .outerHeight() -
                        $(tabNavigator.settings.widgetMetaHeaderSelector)
                            .outerHeight() -
                        $container.find(tabNavigator.settings
                            .allPanelsHeaderSelector + ":visible")
                                .outerHeight() - 1;
                    $container.find(tabNavigator.settings.expandableSelector)
                        .show();
                    $container.find(tabNavigator.settings
                        .expandableContainerSelector).css("min-height",
                            expandMinHeight + "px");
                    $(tabNavigator.currentList).data("isExpanded", true);

                    // Set the height explicitly because IE6 cannot render
                    // height 100% properly.
                    $metaContainer.addClass("expanded")
                        .height($(tabNavigator.settings
                            .widgetOuterContainerSelector).height());
                    $metaContainer.animate({top: "0"},
                        function()
                        {
                            tabNavigator.settings.switchCompleteCallback();
                            if (openCallback !== undefined)
                            {openCallback();}
                        });

                }

                $(tabNavigator.settings.widgetMetaSuperHeaderSelector).toggle(open);

                // Toggle all panels.
                $container.find(tabNavigator.settings.allPanelsSelector)
                            .toggleClass(tabNavigator.settings.expandedClass, open);
            }
        }
    });

})(jQuery);
