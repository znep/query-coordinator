class ThemeList

  def initialize
    @parsed_json = JSON.parse(
      ActionView::Base.new.render(file: "#{Rails.root}/app/views/stories/theme_list.json.erb")
    )
    @custom_themes = Theme.all_custom_for_current_domain
  end

  def to_json
    parsed_json.to_json
  end

  def themes
    parsed_json['themes'] + custom_themes.map(&:for_theme_list_config)
  end

  private
  attr_reader :parsed_json, :custom_themes

end
