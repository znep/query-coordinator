module CustomContentHelper

  def render_widget(config)
    return if config.blank?

    if config.is_a? Array
      return config.map{ |config_item| render_widget(config_item) || '' }.join
    else
      if config.type == 'html'
        # take the contents and just dump it in
        return render :text => config.properties.content
      elsif config.can_prepare? && config.can_render?
        file_name = File.join(Rails.root, 'app/views/custom_content', "_#{config.type.gsub(/[^a-z_]/, '')}.erb")
        return '' unless File.exist? file_name

        return render(:partial => config.type, :locals => { :widget => config })
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

  safe_helper :maybe_link_to
end