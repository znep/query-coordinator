/*!
 * Socrata Styleguide v0.1.0
 * Copyright 2015-2016 Socrata, Inc.
 * Licensed under MIT
 */

function DropDown(element) {
  this.dd = element;
  this.orientation = element.getAttribute('data-orientation') || 'bottom';
  this.dd.classList.add('dropdown-orientation-' + this.orientation);

  this.placeholder = this.dd.querySelector('span');
  this.opts = Array.prototype.slice.call(this.dd.querySelectorAll('.dropdown-options > li'));
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

function FlannelFactory(element) {
  var padding = 10;
  var hoverables = Array.prototype.slice.apply(document.querySelectorAll('[data-flannel]'));

  hoverables.forEach(function(hoverable) {
    var flannel = document.querySelector('#' + hoverable.getAttribute('data-flannel'));
    var dismissals = Array.prototype.slice.apply(flannel.querySelectorAll('[data-flannel-dismiss]'));

    dismissals.forEach(function(dismissal) {
      dismissal.addEventListener('click', function() {
        flannel.classList.add('flannel-hidden');
        hoverable.classList.remove('active');
      });
    });

    hoverable.addEventListener('click', function() {
      flannel.classList.toggle('flannel-hidden');
      var node = hoverable;
      var left = 0;
      var top = 0;

      do {
        left += node.offsetLeft;
        top += node.offsetTop;
      } while ((node = node.offsetParent) !== null);

      left = left + hoverable.offsetWidth / 2;
      top = top + hoverable.offsetHeight + padding;

      flannel.style.left = left + 'px';
      flannel.style.top = top + 'px';
    });
  });

}

function FlyoutFactory(element) {
  var padding = 10;
  var hoverables = Array.prototype.slice.apply(document.querySelectorAll('[data-flyout]'));

  hoverables.forEach(function(hoverable) {
    var flyout = document.querySelector('#' + hoverable.getAttribute('data-flyout'));

    hoverable.addEventListener('mouseover', function() {
      flyout.classList.remove('flyout-hidden');
      var node = hoverable;
      var left = 0;
      var top = 0;

      do {
        left += node.offsetLeft;
        top += node.offsetTop;
      } while ((node = node.offsetParent) !== null);

      left = left + hoverable.offsetWidth / 2;
      top = top + hoverable.offsetHeight + padding;

      flyout.style.left = left + 'px';
      flyout.style.top = top + 'px';
    });

    hoverable.addEventListener('mouseout', function() {
      flyout.classList.add('flyout-hidden');
    });
  });

}

function MenuFactory(element) {
  var menus = Array.prototype.slice.call(element.querySelectorAll('.menu'));
  var toggles = Array.prototype.slice.call(element.querySelectorAll('[data-menu-toggle]'));

  toggles.forEach(function(toggle) {
    toggle.addEventListener('click', function() {
      var menu = element.querySelector('#' + toggle.getAttribute('data-menu-toggle'));
      menu.classList.toggle('active');
    });
  });

  menus.forEach(function(menu) {
    var dismissals = Array.prototype.slice.call(menu.querySelectorAll('[data-menu-dismiss]'));

    dismissals.forEach(function(dismissal) {
      dismissal.addEventListener('click', function() {
        menu.classList.remove('active');
        document.querySelector('[data-menu-toggle="' + menu.id + '"]').classList.remove('active');
      });
    });
  });
}

function ModalFactory(element) {
  this.root = element;
  this.dismissals = Array.prototype.slice.apply(element.querySelectorAll('[data-modal-dismiss]'));
  this.openers = Array.prototype.slice.apply(element.querySelectorAll('[data-modal]'));
  this.attachEvents();
}

ModalFactory.prototype = {
  attachEvents: function() {
    this.dismissals.forEach(function (dismissal) {
      dismissal.addEventListener('click', this.dismiss.bind(this));
    }, this);

    this.openers.forEach(function (opener) {
      opener.addEventListener('click', this.open.bind(this));
    }, this);

    document.addEventListener('keyup', function(event) {
      var key = event.which || event.keyCode;

      // ESC
      if (key === 27) {
        var modals = Array.prototype.slice.call(document.querySelectorAll('.modal:not(.modal-hidden)'));
        modals.forEach(function(modal) {
          modal.classList.add('modal-hidden');
        });
      }
    });
  },
  open: function(event) {
    var modal = event.target.getAttribute('data-modal');
    modal = this.root.querySelector('#' + modal);
    modal.classList.remove('modal-hidden');
  },
  dismiss: function(event) {
    var target = event.target;
    var closeable = target === event.currentTarget &&
      target.classList.contains('modal-overlay');

    do {
      if (target.hasAttribute('data-modal-dismiss') &&
          !target.classList.contains('modal')) {
        closeable = true;
      } else if (target.classList.contains('modal') && closeable) {
        return target.classList.add('modal-hidden');
      } else if (target.classList.contains('modal')){
        return;
      }
    } while((target = target.parentNode) !== this.root);
  }
};

function ToggleFactory(element) {
  var toggles = Array.prototype.slice.apply(element.querySelectorAll('[data-toggle]'));
  this.element = element;

  toggles.forEach(function(toggle) {
    toggle.addEventListener('click', this.toggle.bind(this));
  }, this);
}

ToggleFactory.prototype = {
  toggle: function(event) {
    var target = event.target;

    do {
      if (target.hasAttribute('data-toggle')) {
        return target.classList.toggle('active')
      }
    } while((target = target.parentNode) !== this.element)
  }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRyb3Bkb3duLmpzIiwiZmxhbm5lbC5qcyIsImZseW91dC5qcyIsIm1lbnUuanMiLCJtb2RhbC5qcyIsInRvZ2dsZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InN0eWxlZ3VpZGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBEcm9wRG93bihlbGVtZW50KSB7XG4gIHRoaXMuZGQgPSBlbGVtZW50O1xuICB0aGlzLm9yaWVudGF0aW9uID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3JpZW50YXRpb24nKSB8fCAnYm90dG9tJztcbiAgdGhpcy5kZC5jbGFzc0xpc3QuYWRkKCdkcm9wZG93bi1vcmllbnRhdGlvbi0nICsgdGhpcy5vcmllbnRhdGlvbik7XG5cbiAgdGhpcy5wbGFjZWhvbGRlciA9IHRoaXMuZGQucXVlcnlTZWxlY3Rvcignc3BhbicpO1xuICB0aGlzLm9wdHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLmRkLnF1ZXJ5U2VsZWN0b3JBbGwoJy5kcm9wZG93bi1vcHRpb25zID4gbGknKSk7XG4gIHRoaXMudmFsID0gJyc7XG4gIHRoaXMuaW5kZXggPSAtMTtcblxuICB0aGlzLmluaXRFdmVudHMoKTtcbn1cblxuRHJvcERvd24ucHJvdG90eXBlID0ge1xuICBpbml0RXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgb2JqID0gdGhpcztcblxuICAgIG9iai5kZC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIG9iai5kZC5jbGFzc0xpc3QudG9nZ2xlKCdhY3RpdmUnKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcblxuICAgIG9iai5vcHRzLmZvckVhY2goZnVuY3Rpb24ob3B0KSB7XG4gICAgICBvcHQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIHZhciBub2RlID0gb3B0O1xuICAgICAgICB2YXIgaW5kZXggPSAwO1xuXG4gICAgICAgIHdoaWxlICgobm9kZSA9IG5vZGUucHJldmlvdXNFbGVtZW50U2libGluZykgIT09IG51bGwpIHtcbiAgICAgICAgICBpbmRleCsrO1xuICAgICAgICB9XG5cbiAgICAgICAgb2JqLnZhbCA9IG9wdC50ZXh0Q29udGVudDtcbiAgICAgICAgb2JqLmluZGV4ID0gaW5kZXg7XG4gICAgICAgIG9iai5wbGFjZWhvbGRlci50ZXh0Q29udGVudCA9ICdHZW5kZXI6ICcgKyBvYmoudmFsO1xuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG4iLCJmdW5jdGlvbiBGbGFubmVsRmFjdG9yeShlbGVtZW50KSB7XG4gIHZhciBwYWRkaW5nID0gMTA7XG4gIHZhciBob3ZlcmFibGVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLWZsYW5uZWxdJykpO1xuXG4gIGhvdmVyYWJsZXMuZm9yRWFjaChmdW5jdGlvbihob3ZlcmFibGUpIHtcbiAgICB2YXIgZmxhbm5lbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnICsgaG92ZXJhYmxlLmdldEF0dHJpYnV0ZSgnZGF0YS1mbGFubmVsJykpO1xuICAgIHZhciBkaXNtaXNzYWxzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGZsYW5uZWwucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtZmxhbm5lbC1kaXNtaXNzXScpKTtcblxuICAgIGRpc21pc3NhbHMuZm9yRWFjaChmdW5jdGlvbihkaXNtaXNzYWwpIHtcbiAgICAgIGRpc21pc3NhbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBmbGFubmVsLmNsYXNzTGlzdC5hZGQoJ2ZsYW5uZWwtaGlkZGVuJyk7XG4gICAgICAgIGhvdmVyYWJsZS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaG92ZXJhYmxlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICBmbGFubmVsLmNsYXNzTGlzdC50b2dnbGUoJ2ZsYW5uZWwtaGlkZGVuJyk7XG4gICAgICB2YXIgbm9kZSA9IGhvdmVyYWJsZTtcbiAgICAgIHZhciBsZWZ0ID0gMDtcbiAgICAgIHZhciB0b3AgPSAwO1xuXG4gICAgICBkbyB7XG4gICAgICAgIGxlZnQgKz0gbm9kZS5vZmZzZXRMZWZ0O1xuICAgICAgICB0b3AgKz0gbm9kZS5vZmZzZXRUb3A7XG4gICAgICB9IHdoaWxlICgobm9kZSA9IG5vZGUub2Zmc2V0UGFyZW50KSAhPT0gbnVsbCk7XG5cbiAgICAgIGxlZnQgPSBsZWZ0ICsgaG92ZXJhYmxlLm9mZnNldFdpZHRoIC8gMjtcbiAgICAgIHRvcCA9IHRvcCArIGhvdmVyYWJsZS5vZmZzZXRIZWlnaHQgKyBwYWRkaW5nO1xuXG4gICAgICBmbGFubmVsLnN0eWxlLmxlZnQgPSBsZWZ0ICsgJ3B4JztcbiAgICAgIGZsYW5uZWwuc3R5bGUudG9wID0gdG9wICsgJ3B4JztcbiAgICB9KTtcbiAgfSk7XG5cbn1cbiIsImZ1bmN0aW9uIEZseW91dEZhY3RvcnkoZWxlbWVudCkge1xuICB2YXIgcGFkZGluZyA9IDEwO1xuICB2YXIgaG92ZXJhYmxlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1mbHlvdXRdJykpO1xuXG4gIGhvdmVyYWJsZXMuZm9yRWFjaChmdW5jdGlvbihob3ZlcmFibGUpIHtcbiAgICB2YXIgZmx5b3V0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycgKyBob3ZlcmFibGUuZ2V0QXR0cmlidXRlKCdkYXRhLWZseW91dCcpKTtcblxuICAgIGhvdmVyYWJsZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW92ZXInLCBmdW5jdGlvbigpIHtcbiAgICAgIGZseW91dC5jbGFzc0xpc3QucmVtb3ZlKCdmbHlvdXQtaGlkZGVuJyk7XG4gICAgICB2YXIgbm9kZSA9IGhvdmVyYWJsZTtcbiAgICAgIHZhciBsZWZ0ID0gMDtcbiAgICAgIHZhciB0b3AgPSAwO1xuXG4gICAgICBkbyB7XG4gICAgICAgIGxlZnQgKz0gbm9kZS5vZmZzZXRMZWZ0O1xuICAgICAgICB0b3AgKz0gbm9kZS5vZmZzZXRUb3A7XG4gICAgICB9IHdoaWxlICgobm9kZSA9IG5vZGUub2Zmc2V0UGFyZW50KSAhPT0gbnVsbCk7XG5cbiAgICAgIGxlZnQgPSBsZWZ0ICsgaG92ZXJhYmxlLm9mZnNldFdpZHRoIC8gMjtcbiAgICAgIHRvcCA9IHRvcCArIGhvdmVyYWJsZS5vZmZzZXRIZWlnaHQgKyBwYWRkaW5nO1xuXG4gICAgICBmbHlvdXQuc3R5bGUubGVmdCA9IGxlZnQgKyAncHgnO1xuICAgICAgZmx5b3V0LnN0eWxlLnRvcCA9IHRvcCArICdweCc7XG4gICAgfSk7XG5cbiAgICBob3ZlcmFibGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdXQnLCBmdW5jdGlvbigpIHtcbiAgICAgIGZseW91dC5jbGFzc0xpc3QuYWRkKCdmbHlvdXQtaGlkZGVuJyk7XG4gICAgfSk7XG4gIH0pO1xuXG59XG4iLCJmdW5jdGlvbiBNZW51RmFjdG9yeShlbGVtZW50KSB7XG4gIHZhciBtZW51cyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLm1lbnUnKSk7XG4gIHZhciB0b2dnbGVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1tZW51LXRvZ2dsZV0nKSk7XG5cbiAgdG9nZ2xlcy5mb3JFYWNoKGZ1bmN0aW9uKHRvZ2dsZSkge1xuICAgIHRvZ2dsZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG1lbnUgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnICsgdG9nZ2xlLmdldEF0dHJpYnV0ZSgnZGF0YS1tZW51LXRvZ2dsZScpKTtcbiAgICAgIG1lbnUuY2xhc3NMaXN0LnRvZ2dsZSgnYWN0aXZlJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIG1lbnVzLmZvckVhY2goZnVuY3Rpb24obWVudSkge1xuICAgIHZhciBkaXNtaXNzYWxzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwobWVudS5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1tZW51LWRpc21pc3NdJykpO1xuXG4gICAgZGlzbWlzc2Fscy5mb3JFYWNoKGZ1bmN0aW9uKGRpc21pc3NhbCkge1xuICAgICAgZGlzbWlzc2FsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIG1lbnUuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLW1lbnUtdG9nZ2xlPVwiJyArIG1lbnUuaWQgKyAnXCJdJykuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59XG4iLCJmdW5jdGlvbiBNb2RhbEZhY3RvcnkoZWxlbWVudCkge1xuICB0aGlzLnJvb3QgPSBlbGVtZW50O1xuICB0aGlzLmRpc21pc3NhbHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkoZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1tb2RhbC1kaXNtaXNzXScpKTtcbiAgdGhpcy5vcGVuZXJzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtbW9kYWxdJykpO1xuICB0aGlzLmF0dGFjaEV2ZW50cygpO1xufVxuXG5Nb2RhbEZhY3RvcnkucHJvdG90eXBlID0ge1xuICBhdHRhY2hFdmVudHM6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZGlzbWlzc2Fscy5mb3JFYWNoKGZ1bmN0aW9uIChkaXNtaXNzYWwpIHtcbiAgICAgIGRpc21pc3NhbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuZGlzbWlzcy5iaW5kKHRoaXMpKTtcbiAgICB9LCB0aGlzKTtcblxuICAgIHRoaXMub3BlbmVycy5mb3JFYWNoKGZ1bmN0aW9uIChvcGVuZXIpIHtcbiAgICAgIG9wZW5lci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMub3Blbi5iaW5kKHRoaXMpKTtcbiAgICB9LCB0aGlzKTtcblxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIHZhciBrZXkgPSBldmVudC53aGljaCB8fCBldmVudC5rZXlDb2RlO1xuXG4gICAgICAvLyBFU0NcbiAgICAgIGlmIChrZXkgPT09IDI3KSB7XG4gICAgICAgIHZhciBtb2RhbHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcubW9kYWw6bm90KC5tb2RhbC1oaWRkZW4pJykpO1xuICAgICAgICBtb2RhbHMuZm9yRWFjaChmdW5jdGlvbihtb2RhbCkge1xuICAgICAgICAgIG1vZGFsLmNsYXNzTGlzdC5hZGQoJ21vZGFsLWhpZGRlbicpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcbiAgb3BlbjogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICB2YXIgbW9kYWwgPSBldmVudC50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW1vZGFsJyk7XG4gICAgbW9kYWwgPSB0aGlzLnJvb3QucXVlcnlTZWxlY3RvcignIycgKyBtb2RhbCk7XG4gICAgbW9kYWwuY2xhc3NMaXN0LnJlbW92ZSgnbW9kYWwtaGlkZGVuJyk7XG4gIH0sXG4gIGRpc21pc3M6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdmFyIHRhcmdldCA9IGV2ZW50LnRhcmdldDtcbiAgICB2YXIgY2xvc2VhYmxlID0gdGFyZ2V0ID09PSBldmVudC5jdXJyZW50VGFyZ2V0ICYmXG4gICAgICB0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdtb2RhbC1vdmVybGF5Jyk7XG5cbiAgICBkbyB7XG4gICAgICBpZiAodGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnZGF0YS1tb2RhbC1kaXNtaXNzJykgJiZcbiAgICAgICAgICAhdGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnbW9kYWwnKSkge1xuICAgICAgICBjbG9zZWFibGUgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmICh0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdtb2RhbCcpICYmIGNsb3NlYWJsZSkge1xuICAgICAgICByZXR1cm4gdGFyZ2V0LmNsYXNzTGlzdC5hZGQoJ21vZGFsLWhpZGRlbicpO1xuICAgICAgfSBlbHNlIGlmICh0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdtb2RhbCcpKXtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH0gd2hpbGUoKHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlKSAhPT0gdGhpcy5yb290KTtcbiAgfVxufTtcbiIsImZ1bmN0aW9uIFRvZ2dsZUZhY3RvcnkoZWxlbWVudCkge1xuICB2YXIgdG9nZ2xlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLXRvZ2dsZV0nKSk7XG4gIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG5cbiAgdG9nZ2xlcy5mb3JFYWNoKGZ1bmN0aW9uKHRvZ2dsZSkge1xuICAgIHRvZ2dsZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMudG9nZ2xlLmJpbmQodGhpcykpO1xuICB9LCB0aGlzKTtcbn1cblxuVG9nZ2xlRmFjdG9yeS5wcm90b3R5cGUgPSB7XG4gIHRvZ2dsZTogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICB2YXIgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xuXG4gICAgZG8ge1xuICAgICAgaWYgKHRhcmdldC5oYXNBdHRyaWJ1dGUoJ2RhdGEtdG9nZ2xlJykpIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldC5jbGFzc0xpc3QudG9nZ2xlKCdhY3RpdmUnKVxuICAgICAgfVxuICAgIH0gd2hpbGUoKHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlKSAhPT0gdGhpcy5lbGVtZW50KVxuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
