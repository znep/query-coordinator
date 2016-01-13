class ThemeList

  attr_reader :custom_themes

  def initialize
    @parsed_json = JSON.parse(
      ActionView::Base.new.render(file: "#{Rails.root}/app/views/stories/theme_list.json.erb")
    )
    @custom_themes = Theme.all_custom_for_current_domain
  end

  def to_json
    parsed_json.to_json
  end

  def standard_theme_list
    parsed_json['themes']
  end

  def custom_theme_list
    custom_themes.map(&:for_theme_list_config)
  end

  private

  attr_reader :parsed_json

end
