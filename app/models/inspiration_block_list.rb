class InspirationBlockList

  def initialize
    @json = ActionView::Base.new.render(file: "#{Rails.root}/app/views/stories/inspiration_block_list.json.erb")
  end

  def to_json
    @json
  end

  def blocks
    JSON.parse(@json)["blocks"]
  end

end
