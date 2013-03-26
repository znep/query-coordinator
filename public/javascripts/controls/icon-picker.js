;(function($) { $(function() { 

var icons = [
  'cursor', 'crosshair', 'search', 'zoomin', 'zoomout', 'screenshot', 'binoculars',
  'view', 'attach', 'link', 'move', 'write', 'writingdisabled', 'erase', 'compose',
  'draw', 'lock', 'unlock', 'key', 'backspace', 'ban', 'nosmoking', 'trash', 'target',
  'new', 'tag', 'pricetag', 'flowertag', 'bookmark', 'flag', 'like', 'dislike', 'heart',
  'halfheart', 'emptyheart', 'star', 'halfstar', 'medal', 'ribbon', 'bullseye', 'sample',
  'crop', 'layers', 'gridlines', 'pen', 'feather', 'rubbereraser', 'paintroller', 'rubberstamp',
  'checkclipboard', 'linechartclipboard', 'clockwise', 'phone', 'phonedisabled', 'headset',
  'megaphone', 'rss', 'facetime', 'reply', 'send', 'mail', 'inbox', 'outbox', 'wifimail',
  'chat', 'user', 'femaleuser', 'users', 'usergroup', 'adduser', 'removeuser', 'deleteuser',
  'userprofile', 'businessuser', 'cart', 'addcart', 'removecart', 'deletecart', 'downloadcart',
  'emptycart', 'basket', 'gift', 'apple', 'cashregister', 'store', 'searchbarcode',
  'notepad', 'creditcard', 'safe', 'digitalsafe', 'atm', 'dispensecash', 'banknote',
  'coins', 'bankcheck', 'piggybank', 'moneybag', 'tip', 'calculator', 'percent', 'bank',
  'scales', 'piechart', 'piechartthirds', 'barchart', 'upwardsbarchart', 'downwardsbarchart',
  'horizontalbarchart', 'analytics', 'upwardslinechart', 'downwardslinechart', 'linecharts',
  'scatterchart', 'stock', 'form', 'box', 'crate', 'deliveryvan', 'deliverytruck',
  'forklift', 'cargoship', 'hook', 'weight', 'containers', 'fragile', 'thissideup',
  'home', 'building', 'lodging', 'earth', 'globe', 'garage', 'warehouse', 'floorplan',
  'address', 'searchhouse', 'housesale', 'navigate', 'compass', 'signpost', 'map',
  'gps', 'compassnavigate', 'compassarrow', 'location', 'pin', 'pushpin', 'maplocation',
  'globelocation', 'puzzle', 'floppydisk', 'firewall', 'database', 'hdd', 'music',
  'eighthnote', 'mic', 'volume', 'lowvolume', 'highvolume', 'radio', 'stereo', 'airplay',
  'vinylrecord', 'disc', 'camera', 'picture', 'video', 'playvideo', 'play', 'pause',
  'stop', 'record', 'rewind', 'fastforward', 'skipback', 'skipforward', 'eject',
  'repeat', 'replay', 'shuffle', 'index', 'page', 'book', 'books', 'openbook',
  'heartbook', 'downloadbook', 'musicopenbook', 'searchbook', 'notebook', 'newspaper',
  'notice', 'rows', 'columns', 'thumbnails', 'pagecurl', 'desktop', 'laptop',
  'tablet', 'smartphone', 'cell', 'walkytalky', 'ereader', 'ebook', 'wifibook',
  'wifiopenbook', 'battery', 'highbattery', 'mediumbattery', 'lowbattery',
  'emptybattery', 'chargingbattery', 'heartmobile', 'phonemobile', 'lockmobile',
  'textmobile', 'dollarmobile', 'euromobile', 'rssmobile',
  'navigationmobile', 'batterymobile', 'powermobile', 'browseonline', 'shoponline', 'bankonline',
  'realtyonline', 'readonline', 'weatheronline', 'lightbulb', 'lightbulbon', 'cfl', 'hairdryer',
  'picnictable', 'flame', 'campfire', 'bonfire', 'balloon', 'christmastree', 'sweep',
  'chess', 'onedie', 'twodie', 'threedie', 'fourdie', 'fivedie', 'sixdie', 'downloadcloud',
  'download', 'downloadbox', 'downloadcrate', 'uploadcloud', 'upload', 'uploadbox', 'uploadcrate',
  'fork', 'merge', 'refresh', 'sync', 'loading', 'wifi', 'connection', 'reload', 'file',
  'addfile', 'removefile', 'deletefile', 'downloadfile', 'uploadfile', 'importfile',
  'exportfile', 'settingsfile', 'lockfile', 'userfile', 'picturefile', 'textfile', 'exe',
  'zip', 'doc', 'ppt', 'pdf', 'jpg', 'png', 'folder', 'openfolder', 'downloadfolder',
  'uploadfolder', 'cloudfolder', 'lockfolder', 'securefolder', 'picturefolder', 'moviefolder',
  'quote', 'text', 'font', 'highlight', 'print', 'fax', 'list', 'layout', 'action', 'redirect',
  'expand', 'contract', 'help', 'info', 'alert', 'caution', 'logout', 'login', 'scaleup',
  'scaledown', 'plus', 'hyphen', 'check', 'delete', 'bearface', 'bird', 'fishes', 'tropicalfish',
  'tree', 'evergreen', 'palmtree', 'leaf', 'seedling', 'grass', 'settings', 'dashboard',
  'dial', 'notifications', 'notificationsdisabled', 'flash', 'wrench', 'tapemeasure',
  'clock', 'watch', 'stopwatch', 'alarmclock', 'calendar', 'addcalendar', 'removecalendar',
  'checkcalendar', 'deletecalendar', 'sausage', 'burger', 'pizza', 'fish', 'shrimp',
  'turkey', 'steak', 'sidedish', 'noodles', 'spaghetti', 'corn', 'carrot', 'icecream',
  'mug', 'beer', 'bottle', 'wineglass', 'cocktail', 'tea', 'teapot', 'waterbottle', 'wineglasssparkle',
  'salt', 'pepper', 'oliveoil', 'hotsauce', 'coal', 'oven', 'stove', 'cook', 'bbq', 'utensils',
  'spoonfork', 'knife', 'cookingutensils', 'measuringcup', 'colander', 'scale', 'eggtimer',
  'platter', 'apron', 'bbqapron', 'chef', 'handbag', 'briefcase', 'hanger', 'weathervane',
  'thermometer', 'weather', 'cloud', 'droplet', 'sun', 'partlycloudy', 'rain', 'thunderstorm',
  'umbrella', 'rainbow', 'fog', 'wind', 'tornado', 'snowflake', 'fan', 'solarpanel',
  'plug', 'outlet', 'car', 'taxi', 'locomotive', 'train', 'traintunnel', 'bus', 'truck',
  'caravan', 'tractor', 'tunnel', 'plane', 'arrival', 'departure', 'helicopter', 'bike',
  'motorcycle', 'boat', 'sailboat', 'schooner', 'skylift', 'rocket', 'steeringwheel',
  'trafficcamera', 'fuel', 'jerrycan', 'passport', 'trafficlight', 'highway', 'road',
  'intersection', 'wheelchair', 'elevator', 'golf', 'hockey', 'iceskate', 'billiards',
  'baseballglove', 'tennis', 'tabletennis', 'badminton', 'boxing', 'bowling', 'football',
  'soccer', 'hiker', 'pool', 'shower', 'exercise', 'exercisebike', 'dumbbell', 'jumprope',
  'yoga', 'suitcase', 'luggage', 'donotdisturb', 'sunscreen', 'callbell', 'hospital',
  'medicalcross', 'ambulance', 'bandage', 'medicalthermometer', 'stethoscope', 'syringe',
  'pill', 'pillbottle', 'supplements', 'bathroomscale', 'dna', 'anatomicalheart', 'checkheart',
  'eyesurgery', 'brokenbone', 'up', 'upright', 'right', 'downright', 'down', 'downleft',
  'left', 'upleft', 'navigateup', 'navigateright', 'navigatedown', 'navigateleft', 'directup',
  'directright', 'dropdown', 'directleft', 'leftright', 'rightward', 'leftward', 'previouspage',
  'nextpage', 'retweet', 'share'
];

$.fn.iconPicker = function()
{
    this.each(function()
    {
        var $a = $(this);

        $a.on('click', function(event) { event.preventDefault(); });

        $a.popupSelect({
            choices: icons,
            listContainerClass: 'iconPicker',
            prompt: 'Please choose an icon:',
            renderer: function(icon)
            {
                return { tagName: 'span', 'class': 'ss-' + icon };
            },
            selectCallback: function(icon)
            {
                $a.text(icon);
                $a.trigger('change', icon);
            }
        });
    });
};

}) })(jQuery);

