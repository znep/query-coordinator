class ThemeList

  def initialize
    @json = ActionView::Base.new.render(file: "#{Rails.root}/app/views/stories/theme_list.json.erb")
  end

  def to_json
    @json
  end

  def themes
    JSON.parse(@json)['themes']
  end
end
