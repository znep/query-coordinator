class InspirationCategoryList

  def initialize
    @json = ActionView::Base.new.render(file: "#{Rails.root}/app/views/stories/inspiration_category_list.json.erb")
    @parsed_json = JSON.parse(@json)
  end

  def to_json
    @json
  end

  def to_parsed_json
    @parsed_json
  end

  def blocks
    @parsed_json.map { |index, value| value['blocks'] }.flatten
  end
end
