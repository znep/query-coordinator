function DropDown(element) {
  this.dd = element;
  this.placeholder = this.dd.querySelector('span');
  this.opts = Array.prototype.slice.call(this.dd.querySelectorAll('ul.dropdown > li'));
  this.val = '';
  this.index = -1;
  this.initEvents();
}

DropDown.prototype = {
  initEvents: function() {
    var obj = this;

    obj.dd.addEventListener('click', function(event) {
      event.stopPropagation();
      obj.dd.classList.toggle('active');
      return false;
    });

    obj.opts.forEach(function(opt) {
      opt.addEventListener('click', function(event) {
        event.preventDefault();

        var node = opt;
        var index = 0;

        while ((node = node.previousElementSibling) !== null) {
          index++;
        }

        obj.val = opt.textContent;
        obj.index = index;
        obj.placeholder.textContent = 'Gender: ' + obj.val;

        return false;
      });
    });
  }
}
