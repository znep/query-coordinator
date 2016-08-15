module.exports = function TabsFactory(element) {
  var tabSections = Array.prototype.slice.call(element.querySelectorAll('[data-tabs]'));

  tabSections.forEach(function(section) {
    var tabLinks = Array.prototype.slice.call(section.querySelectorAll('[data-tab-id]'));
    var tabContents = Array.prototype.slice.call(section.querySelectorAll('[data-tab-content]'));

    tabLinks.forEach(function(link) {
      link.addEventListener('click', function(event) {
        event.preventDefault();
        var tabId = event.currentTarget.dataset.tabId;

        tabLinks.forEach(function(tabLink) {
          tabLink.classList.remove('current');
        });

        tabContents.forEach(function(content) {
          content.classList.remove('current');
        });

        link.classList.add('current');
        section.querySelector(`#${tabId}`).classList.add('current');
      });
    });
  });
};
