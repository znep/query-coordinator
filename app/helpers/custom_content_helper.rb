module CustomContentHelper

  def render_widget(widget)
    return if widget.blank?

    if widget.is_a? Array
      return widget.map{ |widget_item| render_widget(widget_item) || '' }.join
    else
      if widget.type == 'html'
        # take the contents and just dump it in
        return render :text => widget.properties.content
      elsif widget.passthrough?
        return render_widget(widget.children)
      elsif widget.can_prepare? && widget.can_render?
        file_name = File.join(Rails.root, 'app/views/custom_content', "_#{widget.type.gsub(/[^a-z_]/, '')}.erb")
        return '' unless File.exist? file_name

        return render(:partial => widget.type, :locals => { :widget => widget })
      end
    end
  end

  # Widget-specific helpers
  def maybe_link_to(text, url, maeby)
    if maeby
      link_to(h(text), h(url))
    else
      h(text)
    end
  end
end
