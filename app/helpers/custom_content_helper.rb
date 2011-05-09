module CustomContentHelper

  def render_widget(config)
    return if config.blank?

    if config.is_a? Array
      return config.map{ |config_item| render_widget(config_item) || '' }.join
    else
      case config.type
      when 'html'
        # take the contents and just dump it in
        return render :text => config.properties.content
      when 'catalog'
        # TODO: caching!
        return render_browse
      else
        # nothing special we have to do for this type; find the html
        # fragment that the type points at, and attempt to render it

        # TODO: actually check for file
        return render :partial => config.type, :locals => { :widget => config } rescue nil
      end
    end
  end

end