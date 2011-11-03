class Page < SodaModel
  def render
    '<div class="socrata-root" id="socrata-root"></div>'
    
    # TODO - actual render
  end

  def self.[](path)
    find(:path => path, :status => :published).first
  end

  def content
    @update_data['content'] || @data['content']
  end

  def data
    @update_data['data'] || @data['data']
  end
end
