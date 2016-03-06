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

  def default_meta_tags(tags = [])
    defaults = [
      tag('meta', :charset => 'utf-8'),
      tag('meta', 'http-equiv' => 'x-ua-compatible', :content => 'ie=edge')
    ]

    (defaults + tags).uniq.join("\n").html_safe
  end

  def storyteller_javascript_include_tag(file)
    root = Rails.application.config.relative_url_root
    uri = "#{root}/js/#{webpack_assets[file]['js']}"

    content_tag('script', '', :type => 'text/javascript', :src => uri)
  end

  private

  def webpack_assets
    @manifest ||= JSON.parse(File.read(Rails.root.join('webpack-assets.json')))
  end
end
