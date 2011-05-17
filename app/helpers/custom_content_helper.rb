module CustomContentHelper

  def render_widget(config)
    return if config.blank?

    if config.is_a? Array
      return config.map{ |config_item| render_widget(config_item) || '' }.join
    else
      if config.type == 'html'
        # take the contents and just dump it in
        return render :text => config.properties.content
      elsif config.can_render?
        file_name = File.join(Rails.root, 'app/views/custom_content', "_#{config.type.gsub(/[^a-z_]/, '')}.erb")
        return '' unless File.exist? file_name

        return render(:partial => config.type, :locals => { :widget => config })
      end
    end
  end

end