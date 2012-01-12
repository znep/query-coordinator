$(function()
{
    var $feedbackWidg = $('.wbWidget');
    var toggleFeedback = function(event)
    {
        event.preventDefault();
        var $this = $(this);

        if (!$this.is('h2'))
        {
            $this = $feedbackWidg.find('h2');
        }
        $this.toggleClass('expanded')
             .siblings('.widgetContent').toggle();
    };
    $feedbackWidg.find('h2').click(toggleFeedback);
    $('#sidebarFeedbackLink').click(toggleFeedback);

    var title = document.title;
    if (title.indexOf('|') > -1)
    {
        title = title.substring(0, title.indexOf('|') - 1);
    }
    $('.worldBankSocialLinks .templatedLink').each(function()
    {
        $(this).attr('href',
            $(this).attr('href')
                .replace('{title}', title)
                .replace('{location}', document.location));
    });
    $('.worldBankSocialLinks .printLink').click(function(event)
    {
        event.preventDefault();
        window.print();
    });

    var patterns = {
        '/facet/countries': 'countries',
        '/page/organization': 'organization',
        '/page/funds': 'funds',
        '/page/datasets': 'datasets',
        '/page/faqs': 'faqs',
        '/page/about': 'about'
    };
    var match = 'home';
    for (var pattern in patterns)
    {
        if (window.location.pathname.indexOf(pattern) == 0)
        {
            match = patterns[pattern];
            break;
        }
    }
    $('.worldBankNav .textNav li.' + match).addClass('active');

    // // social dropdown
    // var $social = $('.worldBankSocialLinks .share');
    // var $socialDropdown = $('.worldBankSocialLinks .socialDropdown');
    // $social.click(function(event)
    // {
    //     event.preventDefault();
    //     $socialDropdown.toggle();
    //     $social.toggleClass('active');
    // });

    // ugh.
    var countryToMapUrl = {"Angola":"/afr/angola","Benin":"/afr/benin","Botswana":"/afr/botswana","Burkina Faso":"/afr/burkina-faso","Burundi":"/afr/burundi","Cameroon":"/afr/cameroon","Cape Verde":"/afr/cape-verde","Central African Republic":"/afr/central-african-republic","Chad":"/afr/chad","Comoros":"/afr/comoros","Congo, Democratic Republic of":"/afr/congo-dem-rep","Congo, Republic of":"/afr/congo-republic","Cote d'Ivoire":"/afr/cote-divoire","Equatorial Guinea":"/afr/equatorial-guinea","Eritrea":"/afr/eritrea","Ethiopia":"/afr/ethiopia","Gabon":"/afr/gabon","Gambia, The":"/afr/gambia","Ghana":"/afr/ghana","Guinea":"/afr/guinea","Guinea-Bissau":"/afr/guinea-bissau","Kenya":"/afr/kenya","Lesotho":"/afr/lesotho","Liberia":"/afr/liberia","Madagascar":"/afr/madagascar","Malawi":"/afr/malawi","Mali":"/afr/mali","Mauritania":"/afr/mauritania","Mauritius":"/afr/mauritius","Mozambique":"/afr/mozambique","Namibia":"/afr/namibia","Niger":"/afr/niger","Nigeria":"/afr/nigeria","Rwanda":"/afr/rwanda","Sao Tome and Principe":"/afr/sao-tome-and-principe","Senegal":"/afr/senegal","Seychelles":"/afr/seychelles","Sierra Leone":"/afr/sierra-leone","Somalia":"/afr/somalia","South Africa":"/afr/south-africa","South Sudan":"/afr/south-sudan","Sudan":"/afr/sudan","Swaziland":"/afr/swaziland","Tanzania":"/afr/tanzania","Togo":"/afr/togo","Uganda":"/afr/uganda","Zambia":"/afr/zambia","Zimbabwe":"/afr/zimbabwe","Cambodia":"/eap/cambodia","China":"/eap/china","Fiji":"/eap/fiji","Indonesia":"/eap/indonesia","Kiribati":"/eap/kiribati","Lao People's Democratic Republic":"/eap/lao-pdr","Malaysia":"/eap/malaysia","Mongolia":"/eap/mongolia","Myanmar":"/eap/myanmar","Palau":"/eap/palau","Papua New Guinea":"/eap/papua-new-guinea","Philippines":"/eap/philippines","Samoa":"/eap/samoa","Solomon Islands":"/eap/solomon-islands","Korea, Republic of":"/eap/korea-republic","Thailand":"/eap/thailand","Timor-Leste":"/eap/timor-leste","Tonga":"/eap/tonga","Vanuatu":"/eap/vanuatu","Vietnam":"/eap/vietnam","Albania":"/eca/albania","Armenia":"/eca/armenia","Azerbaijan":"/eca/azerbaijan","Belarus":"/eca/belarus","Bosnia and Herzegovina":"/eca/bosnia-and-herzegovina","Bulgaria":"/eca/bulgaria","Croatia":"/eca/croatia","Georgia":"/eca/georgia","Kazakhstan":"/eca/kazakhstan","Kosovo":"/eca/kosovo","Kyrgyz Republic":"/eca/kyrgyz-republic","Latvia":"/eca/latvia","Macedonia, former Yugoslav Republic":"/eca/macedonia","Moldova":"/eca/moldova","Montenegro":"/eca/montenegro","Poland":"/eca/poland","Serbia":"/eca/serbia","Romania":"/eca/romania","Russian Federation":"/eca/russian-federation","Tajikistan":"/eca/tajikistan","Turkey":"/eca/turkey","Turkmenistan":"/eca/turkmenistan","Ukraine":"/eca/ukraine","Uzbekistan":"/eca/uzbekistan","Antigua and Barbuda":"/lac/antigua-barbuda","Argentina":"/lac/argentina","Belize":"/lac/belize","Bolivia":"/lac/bolivia","Brazil":"/lac/brazil","Chile":"/lac/chile","Colombia":"/lac/colombia","Costa Rica":"/lac/costa-rica","Dominica":"/lac/dominica","Dominican Republic":"/lac/dominican-republic","Ecuador":"/lac/ecuador","El Salvador":"/lac/el-salvador","Grenada":"/lac/grenada","Guatemala":"/lac/guatemala","Guyana":"/lac/guyana","Haiti":"/lac/haiti","Honduras":"/lac/honduras","Jamaica":"/lac/jamaica","Mexico":"/lac/mexico","Nicaragua":"/lac/nicaragua","Panama":"/lac/panama","Paraguay":"/lac/paraguay","Peru":"/lac/peru","St. Kitts and Nevis":"/lac/st-kitts-and-nevis","St. Lucia":"/lac/st-lucia","St. Vincent and the Grenadines":"/lac/st-vincent-and-the-grenadines","Suriname":"/lac/suriname","Trinidad and Tobago":"/lac/trinidad-tobago","Uruguay":"/lac/uruguay","Venezuela, Republica Bolivariana de":"/lac/venezuela","Algeria":"/mena/algeria","Djibouti":"/mena/djibouti","Egypt, Arab Republic of":"/mena/egypt-arab-republic","Iran, Islamic Republic of":"/mena/iran-islamic-republic","Iraq":"/mena/iraq","Jordan":"/mena/jordan","Lebanon":"/mena/lebanon","Libya":"/mena/libya","Morocco":"/mena/morocco","Syrian Arab Republic":"/mena/syrian-arab-republic","Tunisia":"/mena/tunisia","West Bank and Gaza":"/mena/west-bank-and-gaza","Yemen, Republic of":"/mena/yemen-republic","Afghanistan":"/sa/afghanistan","Bangladesh":"/sa/bangladesh","Bhutan":"/sa/bhutan","India":"/sa/india","Maldives":"/sa/maldives","Nepal":"/sa/nepal","Pakistan":"/sa/pakistan","Sri Lanka":"/sa/srilanka"};
    $('.wbMapsLink').each(function()
    {
        var $this = $(this);
        var urlsuff = countryToMapUrl[$('.countrySummary + h1').text()];
        if (!urlsuff)
            $this.closest('li').remove();
        else
            $this.attr('href', $this.attr('href') + urlsuff);
    });
});
