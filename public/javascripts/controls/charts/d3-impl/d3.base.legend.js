(function($)
{

$.Control.registerMixin('d3_base_legend', {

    initializeVisualization: function()
    {
        var vizObj = this;

        this._super();

        if (this.hasLegend()) this.renderLegend();

        // We're interested in some events coming from the primary view.
        var handleConditionalFormattingChange = function()
        {
            if (vizObj._legendRequiresConditionalFormat())
            {
                vizObj.renderLegend();
            }
        };

        vizObj._primaryView.bind('conditionalformatting_change', handleConditionalFormattingChange, vizObj);
    },

    _legendRequiresConditionalFormat: function()
    {
        var vizObj = this,
            legendPosition = vizObj.legendPosition(),
            legendDetails = vizObj._displayFormat.legendDetails || { showSeries: true },
            $legendContainer = vizObj.$legendContainer();

        return (legendDetails.showConditional === true) &&
            _.isArray($.deepGet(vizObj._primaryView, 'metadata', 'conditionalFormatting'));
    },

    renderLegend: function()
    {
        if (!this.hasLegend()) return;

        var vizObj = this,
            legendPosition = vizObj.legendPosition(),
            legendDetails = vizObj._displayFormat.legendDetails || { showSeries: true },
            $legendContainer = vizObj.$legendContainer();

        $legendContainer.empty();
        $legendContainer.removeClass('top right bottom left');
        $legendContainer.addClass($.htmlEscape(legendPosition));

        // first render series if they were asked for
        if (legendDetails.showSeries === true)
        {
            _.each(vizObj.getValueColumns(), function(colDef)
            {
                $legendContainer.append(vizObj._renderLegendLine({ color: vizObj._d3_getColor(colDef) }, colDef.column.name));
            });
        }
        // next render conditional formats if they were asked for
        if (vizObj._legendRequiresConditionalFormat())
        {
            _.each(vizObj._primaryView.metadata.conditionalFormatting, function(condition)
            {
                var label = condition.description || '(no description given)';
                if (!$.isBlank(condition.color))
                {
                    $legendContainer.append(vizObj._renderLegendLine({ color: condition.color }, label));
                }
                else
                {
                    // something's gone wrong, can't put icons on charts yet.
                    // though, i can see the argument for icons on scatter plots.
                    // either way, this should never fire.
                }
            });
        }
        // and then we have value markers
        if (legendDetails.showValueMarkers &&
            _.isArray(vizObj._displayFormat.valueMarker))
        {
            _.each(vizObj._displayFormat.valueMarker, function(valueMarker)
            {
                $legendContainer.append(vizObj._renderLegendLine({ line: valueMarker.color }, valueMarker.caption));
            });
        }
        // last render custom items
        if (_.isArray(legendDetails.customEntries))
        {
            _.each(legendDetails.customEntries, function(customEntry)
            {
                $legendContainer.append(vizObj._renderLegendLine({ color: customEntry.color }, customEntry.label));
            });
        }
    },

    $legendContainer: function()
    {
        // implement me!
        return $('<div/>');
    },

    hasLegend: function()
    {
        return this._displayFormat.legend !== 'none';
    },

    legendPosition: function()
    {
        return this._displayFormat.legend || 'bottom';
    },

    _renderLegendLine: function(iconOpts, label)
    {
        var htmlIconOpts = {};

        // Trim the label, otherwise browsers like to wrap the line unnecessarily if there's whitespace at the end.
        // Also, if the label text is blank, add a non-breaking space to prevent the same issue.
        var labelText = label ? label.trim() : '';
        var labelEscapedHtml = $.isBlank(labelText) ? '&nbsp;' : $.htmlEscape(labelText);
        if (iconOpts.color)
        {
            htmlIconOpts['class'] = 'legendIcon legendColor';
            htmlIconOpts.style = { 'background-color': iconOpts.color };
        }
        if (iconOpts.line)
        {
            htmlIconOpts['class'] = 'legendIcon legendMarkerLine';
            htmlIconOpts.contents = { tagName: 'span', 'class': 'markerLine', style: { 'border-color': iconOpts.line } };
        }
        if (iconOpts.image)
        {
            htmlIconOpts['class'] = 'legendIcon legendImage';
            htmlIconOpts.contents = { tagName: 'img', src: $.htmlEscape(iconOpts.image), alt: labelEscapedHtml };
        }

        return $.tag({
            tagName: 'div',
            'class': 'legendLine',
            contents: [
                $.extend({ tagName: 'span', 'class': 'legendIcon' }, htmlIconOpts),
                { tagName: 'span', 'class': 'legendLabel', contents: labelEscapedHtml }
            ]
        });
    }

}, null, 'socrataChart');

})(jQuery);
