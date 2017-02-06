module ApplicationHelper
  include SiteChromeHelper
  include LocaleHelper

  # Build translations to pass into javascript
  # Loads only from the lang/editor
  def current_editor_translations
    @translations ||= begin
      I18n.backend.send(:init_translations)
      I18n.backend.send(:translations)
    end

    locale_translations = (@translations[current_locale] || {}).with_indifferent_access
    default_translations = @translations[I18n.default_locale].with_indifferent_access

    locale_translations.reverse_merge!(default_translations)

    locale_translations.slice(:editor)
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

    if webpack_assets
      uri = "#{root}/js/#{webpack_assets[file]['js']}"
    else
      uri = "#{root}/js/#{file}.js"
    end

    content_tag('script', '', :type => 'text/javascript', :src => uri)
  end

  def page_title
    page_title_parts = []
    page_title_parts << @story_metadata.title
    page_title_parts << site_chrome_window_title unless site_chrome_window_title.blank?

    page_title_parts.join(' | ')
  end

  private

  def webpack_assets
    location = Rails.root.join('webpack-assets.json')
    @manifest ||= JSON.parse(File.read(location)) if File.exists?(location)
  end
end
