module StoriesHelper

  def render_block(block)
    block_html = '<div class="block">'

    block.layout.split('-').each_with_index do |component_width, index|
      block_html << "<div class=\"component col#{component_width}\">"
      block_html << render_component(block.components[index])
      block_html << '</div>'
    end

    block_html << '</div>'

    block_html.html_safe
  end

  def user_story_json
    @story.as_json.merge(
      {
        :title => core_attributes['name'] || '',
        :description => core_attributes['description'] || ''
      }
    ).to_json
  end

  private

  def core_attributes
    CoreServer::get_view(@story.uid, CoreServer::headers_from_request(request))
  end

  def render_component(component)
    case component['type']
      when 'text'
        component['value']
      else
        ''
    end
  end
end
