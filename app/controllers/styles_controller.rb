class StylesController < ApplicationController
  skip_before_filter :require_user, :set_user, :hook_auth_controller, :sync_logged_in_cookie
  ssl_allowed :merged, :individual

  def individual
    includes = get_includes

    if params[:stylesheet].present? && params[:stylesheet].match(/^(\w|-)+$/)
      headers['Content-Type'] = 'text/css'
      stylesheet = File.read("#{Rails.root}/app/styles/#{params[:stylesheet]}.sass")

      render :text => Sass::Engine.new(includes + stylesheet,
                                       :style => :nested,
                                       :cache => false,
                                       :load_paths => ["#{Rails.root}/app/styles"]).render
    else
      # someone's up to no good.
      render_404
    end
  end

  def merged
    if STYLE_PACKAGES[params[:stylesheet]].present?
      headers['Content-Type'] = 'text/css'

      cache_key = generate_cache_key(params[:stylesheet])
      cached = Rails.cache.read(cache_key)

      if cached.nil?
        includes_cache_key = generate_cache_key('_includes')
        includes = Rails.cache.read(includes_cache_key)
        if includes.nil?
          includes = get_includes
          Rails.cache.write(includes_cache_key, includes)
        end

        sheets = STYLE_PACKAGES[params[:stylesheet]].map{ |sheet|
                   File.read("#{Rails.root}/app/styles/#{sheet}.sass") }.join("\n")

        rendered_styles = Sass::Engine.new(includes + sheets,
                                           :style => :compressed,
                                           :cache => false,
                                           :load_paths => ["#{Rails.root}/app/styles"]).render
        Rails.cache.write(cache_key, rendered_styles)
        render :text => rendered_styles
      else
        render :text => cached
      end
    else
      render_404
    end
  end

  def widget
    begin
      if params[:customization_id] == 'default'
        theme = WidgetCustomization.default_theme(1)
      else
        customization = WidgetCustomization.find(params[:customization_id])
        theme = customization.customization
        updated_at = customization.updatedAt
      end
    rescue CoreServer::CoreServerError => e
      render_404
    end
    headers['Content-Type'] = 'text/css'

    cache_key = generate_cache_key("widget.#{params[:customization_id]}.#{updated_at || 0}")
    cached = Rails.cache.read(cache_key) unless Rails.env == 'development'

    if cached.nil?
      # get sitewide includes
      includes_cache_key = generate_cache_key('_includes')
      includes = Rails.cache.read(includes_cache_key) unless Rails.env == 'development'
      if includes.nil?
        includes = get_includes
        Rails.cache.write(includes_cache_key, includes)
      end

      # get widget includes
      includes += get_includes_recurse(theme, @@widget_theme_parse)

      # render
      sheet = File.read("#{Rails.root}/app/styles/widget.sass")
      rendered_styles = Sass::Engine.new(includes + sheet,
                                         :style => :compressed,
                                         :cache => false,
                                         :load_paths => ["#{Rails.root}/app/styles"]).render
      Rails.cache.write(cache_key, rendered_styles)
      render :text => rendered_styles
    else
      render :text => cached
    end
  end

  def current_site
    headers['Content-Type'] = 'text/css'
    render :text => CurrentDomain.properties.custom_css
  end

protected
  def get_includes
    result = STYLE_PACKAGES['includes'].map{ |incl| "@import \"#{incl}.sass\"\n" }.join +
             get_includes_recurse(CurrentDomain.theme, @@site_theme_parse)

    return result
  end

  def get_gradient_definition(name, value)
    result = ''

    stops = value.each{ |stop| stop['position'] =
      stop['position'].to_f unless stop['position'].nil? }

    gradient_string = stops.map{ |stop| stop.has_key?('position') ?
      "#{stop['color']}:#{stop['position']}" : stop['color'] }.join(',')

    # ie (based on raw string)
    result += "@mixin box_gradient_#{name}($width, $height, $additional)\n"
    result += '  background-image: url(/ui/box.png?w=#{$width}&h=#{$height}&fc=' +
                 gradient_string + '&#{$additional})' + "\n"

    first_stop = stops.first
    last_stop = stops.last
    stops.delete(stops.first) if stops.first['position'].nil?
    stops.delete(stops.last) if stops.last['position'].nil?

    result += "@mixin gradient_#{name}\n"

    # firefox
    result += "  background: -moz-linear-gradient(0 0 270deg, ##{first_stop['color']}, ##{last_stop['color']}"
    prev_stop_position = 0
    stops.each do |stop|
      stop_position = (stop['position'] * 100).round
      if prev_stop_position == stop_position
        # firefox will ignore stops with duplicate positions
        prev_stop_position = stop_position + 1
      else
        prev_stop_position = stop_position
      end

      result += ", ##{stop['color']} #{prev_stop_position}%"
    end
    result += ")\n"

    # webkit
    result += "  background: -webkit-gradient(linear, left top, left bottom," +
              " from(##{first_stop['color']}), to(##{last_stop['color']})" +
              stops.map{ |stop| ", color-stop(#{stop['position']},##{stop['color']})" }.join +
              ")\n"

    # default background-color for fallback
    result += "  background-color: ##{first_stop['color']}\n"

    return result
  end

  def get_includes_recurse(hash, definition, path = '')
    result = ''
    unless hash.nil?
      hash.each do |key, value|
        if definition[key.to_sym] == 'string'
          result += "$#{path}#{key}: \"#{value}\"\n"
        elsif definition[key.to_sym] == 'boolean'
          result += "$#{path}#{key}: #{value.to_s}\n"
        elsif definition[key.to_sym] == 'dimensions'
          result += "$#{path}#{key}: #{value[:value]}#{value[:unit]}\n"
        elsif definition[key.to_sym] == 'image'
          if value[:type].to_s == "static"
            href = "#{value[:href]}"
          elsif value[:type].to_s == "hosted"
            href = "/assets/#{value[:href]}"
          end
          result += "$#{path}#{key}: url(#{href})\n"
          result += "$#{path}#{key}_width: #{value[:width]}px\n"
          result += "$#{path}#{key}_height: #{value[:height]}px\n"
        elsif definition[key.to_sym] == 'color'
          if value.is_a? String
            # flat color
            if value.match(/([0-9a-f]{3}){1,2}/i)
              # hex color (prepend #)
              result += "$color_#{path}#{key}: ##{value}\n"
            else
              # rgba color (pass through)
              result += "$color_#{path}#{key}: #{value}\n"
            end
            result += "$#{path}#{key}: #{value}\n"
          elsif value.is_a? Array
            # gradient
            next unless value.first.is_a? Hash # hack to accomodate current header color format

            result += get_gradient_definition(path + key.to_s, value.clone())
            colors = value.map {|s| s['color']}.reverse
            rev = []
            value.each_with_index do |s, i|
              a = {'color' => colors[i]}
              if !s['position'].nil?
                a['position'] = 1.0 - s['position'].to_f
              end
              rev << a
            end
            result += get_gradient_definition(path + key.to_s + '_reverse', rev)

          end
        elsif definition[key.to_sym].is_a? Hash
          result += get_includes_recurse(value, definition[key.to_sym], path + "#{key}_")
        end
      end
    end
    return result
  end

  def generate_cache_key(item)
    return  "%s.%s.%s.%s.%s" % [CurrentDomain.cname, item, REVISION_NUMBER,
      CurrentDomain.default_config_id, CurrentDomain.default_config_updated_at]
  end

  @@site_theme_parse = {
    :links     => { :normal      => 'color',
                    :visited     => 'color' },
    :buttons   => {:active       => { :background  => 'color',
                                      :border      => 'color',
                                      :shadow      => 'color',
                                      :text        => 'color' },
                   :disabled     => { :background  => 'color',
                                      :border      => 'color',
                                      :text        => 'color' },
                   :default      => { :background  => 'color',
                                      :border      => 'color',
                                      :text        => 'color' },
                   :default_disabled =>
                                    { :background  => 'color',
                                      :border      => 'color',
                                      :text        => 'color' } },
    :table     => { :header      => { :inactive => 'color',
                                      :active => 'color' } },
    :text      => { :error       => 'color' },
    :images    => { :logo_header => 'image',
                    :logo_footer => 'image' },
    :chrome    => { :background  => 'color',
                    :box_border  => 'color',
                    :sidebar     => { :background => 'color',
                                      :text => 'color' },
                    :nav_buttons => { :background => 'color',
                                      :border => 'color' } } }

  @@widget_theme_parse = {
    :frame     => { :border     => { :color => 'color',
                                     :width => 'dimensions' },
                    :color => 'color',
                    :orientation => 'string',
                    :padding => 'dimensions' },
    :toolbar   => { :color => 'color',
                    :input_color => 'color' },
    :logo      => { :image => 'image',
                    :href => 'string'},
    :menu      => { :button     => { :background => 'color',
                                     :background_hover => 'color',
                                     :border => 'color',
                                     :text => 'color' } },
    :grid      => { :font       => { :face => 'string',
                                     :header_size => 'dimensions',
                                     :data_size => 'dimensions' },
                    :header_icons => 'boolean',
                    :row_numbers => 'boolean',
                    :wrap_header_text => 'boolean',
                    :title_bold => 'boolean',
                    :zebra => 'color' }
  }
end
