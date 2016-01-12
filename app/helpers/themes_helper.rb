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
end
