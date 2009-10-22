$(function()
{
    if ($.fn.qtip)
    {
        $.fn.qtip.styles.blist = {
            background: '#cacaca',
            border: {
                color: '#cacaca',
                radius: 5,
                width: 5
            },
            'font-size': '1.2em',
            tip: 'topLeft'
        };

        $.fn.qtip.styles.blistAlert = {
            background: '#20608f',
            color: '#ffffff',
            border: {
                color: '#20608f',
                radius: 5,
                width: 5
            },
            'font-size': '1.2em',
            tip: 'bottomLeft'
        };
    }
});
