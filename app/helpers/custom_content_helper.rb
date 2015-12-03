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
  def maybe_link_to(text, url, should_link_to)
    if should_link_to
      link_to(h(text), h(url))
    else
      h(text)
    end
  end

  def get_page(config, path, name, params, is_private = false)
    Canvas2::DataContext.reset
    Canvas2::Util.reset
    Canvas2::Util.set_params(params)
    Canvas2::Util.set_request(request)
    Canvas2::Util.set_debug(false)
    Canvas2::Util.is_private(is_private)
    Canvas2::Util.set_no_cache(true)
    Canvas2::Util.set_env({
      domain: CurrentDomain.cname,
      renderTime: Time.now.to_i,
      path: path,
      siteTheme: CurrentDomain.theme,
      currentUser: current_user ? current_user.id : nil,
      current_locale: I18n.locale,
      available_locales: request.env['socrata.available_locales']
    })
    Canvas2::Util.set_path(path)
    Page.new(config.merge({path: path, name: name}). with_indifferent_access)
  end
end
