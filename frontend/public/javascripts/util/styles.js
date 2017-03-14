$(function() {
  blist.namespace.fetch('blist.styles');

  var pendingRules = {};
  var styleRules = {};
  var cssSheets = {};
  var createCssSheet = function(sheetName) {
    // Create the stylesheet source
    var cssID = 'customStyles_' + sheetName;
    var cssText = ['<style type="text/css" id="', cssID, '">'];
    _.each(pendingRules[sheetName] || [], function(item) {
      cssText.push(item.rule);
      cssText.push(' {}\n');
    });
    cssText.push('</style>\n');

    // Render the rules and retrieve the new Stylesheet object
    $('head').append(cssText.join(''));
    var cssElement = $('#' + cssID)[0];
    for (var i = 0; i < document.styleSheets.length; i++) {
      cssSheets[sheetName] = document.styleSheets[i];
      if ((cssSheets[sheetName].ownerNode ||
          cssSheets[sheetName].owningElement) == cssElement) {
        break;
      }
      cssSheets[sheetName] = null;
    }
    if ($.isBlank(cssSheets[sheetName])) {
      throw 'Unable to locate stylesheet';
    }
    styleRules[sheetName] = {};
  };

  var createCssRules = function(sheetName) {
    if ($.isBlank(cssSheets[sheetName])) {
      createCssSheet(sheetName);
    }

    // Give IDs to the rules
    var rules = cssSheets[sheetName].cssRules || cssSheets[sheetName].rules;
    _.each(rules, function(r, i) {
      styleRules[sheetName][pendingRules[sheetName][i].id] = r.style;
    });

    pendingRules[sheetName] = {};
  };

  blist.styles.getStyle = function(sheetName, id) {
    if ($.isBlank(styleRules[sheetName]) && !$.isBlank(pendingRules[sheetName])) {
      createCssRules(sheetName);
    }

    return styleRules[sheetName][id];
  };

  blist.styles.addStyle = function(sheetName, id, rule) {
    if ($.isBlank(cssSheets[sheetName])) {
      pendingRules[sheetName] = pendingRules[sheetName] || [];
      // A bit inefficient, but I'm guessing this pending shouldn't get too
      // large...
      if (_.any(pendingRules[sheetName], function(r) {
          return r.id == id;
        })) {
        return;
      }
      pendingRules[sheetName].push({
        id: id,
        rule: rule
      });
      return;
    }

    if (!$.isBlank(styleRules[sheetName][id])) {
      return;
    }

    var rules = cssSheets[sheetName].cssRules || cssSheets[sheetName].rules;
    if ($.browser.msie) {
      cssSheets[sheetName].addRule(rule, ' ');
    } else {
      cssSheets[sheetName].insertRule(rule + '{}', rules.length);
    }
    styleRules[sheetName][id] = rules[rules.length - 1].style;
  };

  // This will probably mainly be used for perf -- using addRule is really
  // slow in IE, so doing large batches of addStyle to an existing sheet
  // could be painful; but if you can regenerate the whole sheet in one shot,
  // that will be much faster
  blist.styles.resetSheet = function(sheetName) {
    if ($.isBlank(cssSheets[sheetName])) {
      return;
    }
    $('#customStyles_' + sheetName).remove();
    cssSheets[sheetName] = null;
    styleRules[sheetName] = null;
  };

  blist.styles.getReferenceProperty = function(name, prop) {
    var $sr = $('#styleReference');
    if ($sr.length < 1) {
      $('body').append('<div id="styleReference"></div>');
      $sr = $('#styleReference');
    }
    var $item = $sr.find('.' + name);
    if ($item.length < 1) {
      $sr.append('<div class="' + name + '"></div>');
      $item = $sr.find('.' + name);
    }
    return $item.css(prop);
  };
});
