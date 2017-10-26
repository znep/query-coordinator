// Stolen and butchered from styleguide.
(function($) {
  if (!$) {
    console.error('jQuery appears not to be defined on this page!');
    return;
  }

  var dropdownFactory = function(element) {
    if (!element) { return; }
    this.dropdowns = Array.prototype.slice.call(element.querySelectorAll('[data-dropdown]'));
    this.dropdowns.forEach(function(dropdown) {
      new Dropdown(dropdown);
    });
  };

  var Dropdown = function(element) {
    this.dd = element;
    this.orientation = this.dd.getAttribute('data-orientation') || 'bottom';
    this.selectable = this.dd.hasAttribute('data-selectable');

    this.dd.classList.add('dropdown-orientation-' + this.orientation);

    // Set the 'role' and 'aria-expanded' attributes for better ADA/508 compliance.
    this.dd.setAttribute('role', 'button');
    this.dd.setAttribute('aria-expanded', 'false');

    this.placeholder = this.dd.querySelector('span');
    this.opts = Array.prototype.slice.call(this.dd.querySelectorAll('.dropdown-options > li'));

    this.dd.dataset.value = '';
    this.dd.dataset.index = -1;

    this.initEvents();
  };

  Dropdown.prototype = {
    initEvents: function() {
      var obj = this;
      // Reposition dropdown if it's near the edge of the window to avoid
      // the dropdown making the window larger than we wanted
      positionDropdown();

      obj.dd.addEventListener('click', function() {
        positionDropdown();
        obj.dd.classList.toggle('active');

        if (obj.dd.classList.contains('active')) {
          obj.dd.setAttribute('aria-expanded', 'true');
        } else {
          obj.dd.setAttribute('aria-expanded', 'false');
        }

        return false;
      });

      if (obj.selectable) {
        obj.opts.forEach(function(opt) {
          opt.addEventListener('click', function(event) {
            event.preventDefault();

            var node = opt;
            var index = 0;

            while ((node = node.previousElementSibling) !== null) {
              index++;
            }

            obj.dd.dataset.value = opt.textContent;
            obj.dd.dataset.index = index;

            obj.placeholder.innerHTML = opt.innerText.trim();

            return false;
          });
        });
      }

      document.addEventListener('click', function(event) {
        var node = event.target;
        while (node.parentElement && !node.classList.contains('dropdown')) {
          node = node.parentElement;
        }

        if (node !== obj.dd) {
          obj.dd.classList.remove('active');
        }
      });

      window.addEventListener('resize', function() {
        positionDropdown();
      });

      function positionDropdown() {
        var optionsElement = obj.dd.querySelector('.dropdown-options');
        var optionsElementWidth = optionsElement.offsetWidth;
        var windowWidth = document.body.offsetWidth;

        // Get left to check if the dropdown options are hanging off the side of the page
        var node = optionsElement;
        var left = 0;

        do {
          left += node.offsetLeft;
        } while ((node = node.offsetParent) !== null);

        // Update dropdown options position if needed
        if (optionsElementWidth + left >= windowWidth || optionsElement.style.left) {
          var dropdownWidth = obj.dd.getBoundingClientRect().width;
          optionsElement.style.left = -(optionsElementWidth - dropdownWidth) + 'px';
        }
      }
    }
  };

  $(document).ready(function() {
    dropdownFactory(document.querySelector('#site-chrome-header'));
    dropdownFactory(document.querySelector('#site-chrome-footer'));
  });
}(window.$));
