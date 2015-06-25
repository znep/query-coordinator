class InspirationStory

  def initialize
    @json = ActionView::Base.new.render file: "#{Rails.root}/app/views/stories/inspiration_story.json.erb"
  end

  def to_json
    @json
  end

end
