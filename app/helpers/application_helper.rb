module ApplicationHelper

  # Build translations to pass into javascript
  # Loads only from the lang/editor
  def current_editor_translations
    @translations ||= begin
      I18n.backend.send(:init_translations)
      I18n.backend.send(:translations)
    end

    {
      editor: @translations[I18n.locale][:editor].with_indifferent_access
    }
  end
end
