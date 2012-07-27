(function($)
{

$.Control.registerMixin('d3_base_legend', {

    initializeVisualization: function()
    {
        this._super();

        if (this.hasLegend()) this.renderLegend();
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
            _.each(vizObj._valueColumns, function(colDef)
            {
                $legendContainer.append(vizObj._renderLegendLine({ color: colDef.color }, colDef.column.name));
            });
        }
        // next render conditional formats if they were asked for
        if ((legendDetails.showConditional === true) &&
            _.isArray($.deepGet(vizObj._primaryView, 'metadata', 'conditionalFormatting')))
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
        if (iconOpts.color)
        {
            htmlIconOpts['class'] = 'legendIcon legendColor';
            htmlIconOpts.style = { 'background-color': iconOpts.color };
        }
        if (iconOpts.line)
        {
            htmlIconOpts['class'] = 'legendIcon legendMarkerLine';
            htmlIconOpts.contents = { tagName: 'span', 'class': 'markerLine', style: { 'background-color': iconOpts.line } };
        }
        if (iconOpts.image)
        {
            htmlIconOpts['class'] = 'legendIcon legendImage';
            htmlIconOpts.contents = { tagName: 'img', src: $.htmlEscape(iconOpts.image), alt: $.htmlEscape(label) };
        }

        return $.tag({
            tagName: 'div',
            'class': 'legendLine',
            contents: [
                $.extend({ tagName: 'span', 'class': 'legendIcon' }, htmlIconOpts),
                { tagName: 'span', 'class': 'legendLabel', contents: $.htmlEscape(label) }
            ]
        });
    }

}, null, 'socrataChart');

})(jQuery);
