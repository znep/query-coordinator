module PublishedStoriesHelper

  def render_block(block)
    block_html = '<div class="block">'

    block.layout.split('-').each_with_index do |component_width, index|
      block_html << "<div class=\"col#{component_width}\">"
      block_html << render_component(block.components[index])
      block_html << '</div>'
    end

    block_html << '</div>'

    block_html.html_safe
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
