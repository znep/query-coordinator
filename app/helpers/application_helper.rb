module ApplicationHelper

  # Build translations to pass into javascript
  # Loads only from the lang/javascript_translations
  def current_js_translations
    @translations ||= I18n.backend.send(:translations)
    @translations[I18n.locale][:javascript_translations].with_indifferent_access
  end
end
