$(function ()
{
    blist.namespace.fetch('blist.styles');

    var pendingRules = {};
    var styleRules = {};
    var createCssRules = function()
    {
        // Create the stylesheet source
        var cssID = 'customStyles_' + _.uniqueId();
        var cssText = [ '<style type="text/css" id="', cssID, '">\n' ];
        var ids = [];
        _.each(pendingRules, function(rule, id)
        {
            cssText.push(rule);
            cssText.push(" {}\n");
            ids.push(id);
        });
        cssText.push('</style>');

        // Render the rules and retrieve the new Stylesheet object
        $('head').append(cssText.join(''));
        var cssElement = $("#" + cssID)[0];
        var cssSheet;
        for (var i = 0; i < document.styleSheets.length; i++)
        {
            cssSheet = document.styleSheets[i];
            if ((cssSheet.ownerNode || cssSheet.owningElement) == cssElement)
            { break; }
            cssSheet = null;
        }
        if ($.isBlank(cssSheet)) { throw "Unable to locate stylesheet"; }

        // Give IDs to the rules
        var rules = cssSheet.cssRules || cssSheet.rules;
        _.each(rules, function(r, i)
        {
            var rule = r.style;
            styleRules[ids[i]] = rule;
        });

        pendingRules = {};
    }

    blist.styles.getStyle = function(id)
    {
        if ($.isBlank(styleRules[id]) && !$.isBlank(pendingRules[id]))
        { createCssRules(); }
        return styleRules[id];
    };

    blist.styles.addStyle = function(id, rule)
    {
        pendingRules[id] = rule;
    };
});
