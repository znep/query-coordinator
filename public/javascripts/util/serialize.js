;(function($)
{
    $.fn.serializeObject = function()
    {
        var result = {};

        this.find('[name]').each(function()
        {
            // adapted from deparam from the BBQ library
            var $this = $(this);
            var key = $this.attr('name');
            var value = $this.val();

            // bail if we have an unchecked checkbox or radio button, or an unfilled field
            if ($this.is(':radio:not(:checked), :checkbox:not(:checked), .prompt')) { return; }

            var subkeys = key.split('][');

            // are we balanced despite the split?
            if ( /\[/.test(subkeys[0]) && /\]/.test(subkeys[subkeys.length - 1]))
            {
                // we are; account for opening and closing [] and resplit
                subkeys = subkeys.shift().split('[').concat(subkeys);
                subkeys[subkeys.length - 1] = subkeys[subkeys.length - 1].replace(/\]$/, '');
            }

            // go get 'em
            var iter = result;
            for (var i = 0; i < subkeys.length - 1; i++)
            {
                var subkey = (subkeys[i] === '') ? iter.length : subkeys[i];
                if (_.isUndefined(iter[subkey])) { iter[subkey] = (subkeys[i + 1] === '') ? [] : {} }
                iter = iter[subkey];
            }
            iter[subkeys[subkeys.length - 1]] = value;
        });

        return result;
    };
})(jQuery);