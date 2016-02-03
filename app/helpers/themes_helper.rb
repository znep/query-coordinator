module ThemesHelper
  def sass_engine_options
    {
      :style => Rails.env.development? ? :nested : :compressed,
      :syntax => :scss,
      :load_paths => ["#{Rails.root}/app/assets/stylesheets/themes"]
    }
  end

  def cache_key_for_custom_themes(themes)
    return if themes.empty?

    domain = themes.first.try(:domain_cname) || 'no-domain'
    "#{domain}/themes/custom-#{themes.map(&:updated_at).reduce(:+)}"
  end

  # For inline styling of theme sample in the style panel
  # Ex: "color: #FF9933;"
  def theme_style_property(theme, property, var_name)
    "#{property}: #{theme['css_variables'][var_name]};"
  end

  # In the admin UI, does the given form section start out expanded?
  # It should be expanded if the theme has configuration set for
  # that section.
  def section_starts_expanded(theme, section_name)
    case section_name
    when 'list-custom-bullet'
      !(
        theme.css_variables['$list-bullet-character'].blank? ||
        theme.css_variables['$list-bullet-color'].blank? ||
        theme.css_variables['$list-margin-adjustment'].blank?
      )
    when 'google-font-code'
      !theme.google_font_code.blank?
    else
      false
    end
  end
end
