(function($) {
  var styleConfigNS = blist.namespace.fetch('blist.configs.styles');

  var dimensionOptions = [{
    text: 'ems',
    value: 'em'
  }, {
    text: 'points',
    value: 'pt'
  }, {
    text: 'pixels',
    value: 'px'
  }, {
    text: 'inches',
    value: 'in'
  }];

  var fontOptions = [{
      text: 'Arial',
      value: 'helvetica,arial,sans-serif'
    }, // protecting people from themselves!
    {
      text: 'Palatino',
      value: '\'palatino linotype\',palatino,\'book antiqua\',serif'
    }, {
      text: 'Times',
      value: 'times,\'times new roman\',serif'
    }, {
      text: 'Verdana',
      value: 'verdana,sans-serif'
    }, {
      text: 'Georgia',
      value: 'georgia,serif'
    }, {
      text: 'Trebuchet',
      value: '\'trebuchet ms\',sans-serif'
    }
  ];

  var styleOptions = {
    color: {
      field: {
        text: 'Font Color',
        name: 'styles.color',
        type: 'color',
        advanced: true,
        showLabel: true
      }
    },
    'font-family': {
      field: {
        text: 'Font Family',
        name: 'styles.font-family',
        prompt: null,
        type: 'select',
        options: fontOptions
      }
    },
    'font-size': {
      specialType: 'dimensions',
      text: 'Font Size'
    },
    'font-style': {
      field: {
        text: 'Italics',
        name: 'styles.font-style',
        type: 'checkbox',
        trueValue: 'italic',
        falseValue: 'normal'
      }
    },
    'font-weight': {
      field: {
        text: 'Bold',
        name: 'styles.font-weight',
        type: 'checkbox',
        trueValue: 'bold',
        falseValue: 'normal'
      },
      convertFrom: function(v) {
        return v == '700' ? 'bold' : v == '400' ? 'normal' : v;
      }
    },
    'padding-bottom': {
      specialType: 'dimensions',
      text: 'Bottom'
    },
    'padding-left': {
      specialType: 'dimensions',
      text: 'Left'
    },
    'padding-right': {
      specialType: 'dimensions',
      text: 'Right'
    },
    'padding-top': {
      specialType: 'dimensions',
      text: 'Top'
    },
    'text-align': {
      field: {
        text: 'Alignment',
        name: 'styles.text-align',
        type: 'select',
        prompt: null,
        options: [{
          text: 'Left',
          value: 'left'
        }, {
          text: 'Center',
          value: 'center'
        }, {
          text: 'Right',
          value: 'right'
        }]
      }
    },
    'text-decoration': {
      field: {
        text: 'Underline',
        name: 'styles.text-decoration',
        type: 'checkbox',
        trueValue: 'underline',
        falseValue: 'none'
      }
    }
  };

  var styleGroups = {
    padding: {
      title: 'Padding',
      options: ['padding-top', 'padding-bottom',
        'padding-left', 'padding-right'
      ]
    },
    text: {
      title: 'Text Styles',
      options: ['font-size', 'font-family', 'color', 'text-align',
        'font-weight', 'font-style', 'text-decoration'
      ]
    }
  };

  var getDefault = function($elem, propertyName, type, convert) {
    if ($.isBlank($elem)) {
      return null;
    }
    var def = $elem.css(propertyName);
    if (type == 'color') {
      def = '#' + $.rgbToHex($.colorToObj(def));
    }
    if (type == 'dimensions') {
      var value;
      var unit;
      // Attempt to see if something specific has been set on this element
      // If not, assume it is in ems (valid assumption?)
      var m = ($elem.attr('style') || '').match(new RegExp(propertyName +
        ':\\s*(-?[0-9.]+)\\s*(em|px|pt|in);'));
      if (_.isArray(m)) {
        value = m[1];
        unit = m[2];
      } else {
        value = def.slice(0, -2);
        unit = def.slice(-2);
        if (unit == 'px') {
          value = value / 10;
          unit = 'em';
        }
      }
      def = {
        value: value,
        unit: unit
      };
    }
    if (_.isFunction(convert)) {
      def = convert(def);
    }
    return def;
  };

  var getField = function(styleDef, name, defaults) {
    if (styleDef.specialType == 'dimensions') {
      return {
        type: 'group',
        text: styleDef.text,
        includeLabel: true,
        lineClass: 'dimensions',
        options: [{
          type: 'text',
          name: 'styleDimensions.' + name + '.value',
          inputOnly: true,
          defaultValue: (defaults || {}).value
        }, {
          type: 'select',
          name: 'styleDimensions.' + name + '.unit',
          inputOnly: true,
          prompt: null,
          options: dimensionOptions,
          defaultValue: (defaults || {}).unit
        }]
      };
    }
    return $.extend(true, {}, styleDef.field, {
      defaultValue: defaults
    });
  };

  styleConfigNS.getStyles = function(group, $elem) {
    var g = styleGroups[group];
    if (_.isEmpty(g)) {
      return null;
    }

    var sect = {
      title: g.title,
      fields: []
    };
    _.each(g.options, function(k) {
      var s = styleOptions[k];
      var def = getDefault($elem, k, s.specialType || s.field.type, s.convertFrom);
      var field = getField(s, k, def);
      sect.fields.push(field);
    });
    return sect;
  };

  styleConfigNS.convertProperties = function(props) {
    var styles = props.styles || {};
    _.each(props.styleDimensions, function(v, k) {
      if (!$.isBlank(v.value) && !$.isBlank(v.unit)) {
        styles[k] = v.value + v.unit;
      }
    });
    return styles;
  };

})(jQuery);
