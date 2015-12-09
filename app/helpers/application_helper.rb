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
    }.with_indifferent_access
  end

  def default_meta_tags
    [
      tag('meta', :charset => 'utf-8'),
      tag('meta', 'http-equiv' => 'x-ua-compatible', :content => 'ie=edge'),
      tag('meta', :name => 'viewport', :content => 'width=device-width, initial-scale=1')
    ].join("\n").html_safe
  end
end
