class InspirationStory

  def initialize
    json_file = File.read("#{Rails.root}/app/views/stories/inspiration_story.json.erb")
    story_template = ERB.new(json_file)
    @json = story_template.result
  end

  def as_json
    @json
  end

end
