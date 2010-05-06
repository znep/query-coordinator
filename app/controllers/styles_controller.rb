class StylesController < ApplicationController
  skip_before_filter :require_user, :set_user, :hook_auth_controller

  def individual
    includes = get_includes

    if params[:stylesheet].present? && params[:stylesheet].match(/^(\w|-)+$/)
      headers['Content-Type'] = 'text/css'
      stylesheet = File.read("#{Rails.root}/app/styles/#{params[:stylesheet]}.sass")

      render :text => Sass::Engine.new(includes + stylesheet,
                                       :style => :nested,
                                       :cache => false,
                                       :load_paths => "#{Rails.root}/app/styles").render
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
                                           :load_paths => "#{Rails.root}/app/styles").render
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
      theme = WidgetCustomization.find(params[:customization_id]).customization
    rescue CoreServer::CoreServerError => e
      render_404
    end
    headers['Content-Type'] = 'text/css'

    cache_key = generate_cache_key("widget.#{params[:customization_id]}")
    cached = Rails.cache.read(cache_key) unless RAILS_ENV == 'development'

    if cached.nil?
      # get sitewide includes
      includes_cache_key = generate_cache_key('_includes')
      includes = Rails.cache.read(includes_cache_key) unless RAILS_ENV == 'development'
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
                                         :load_paths => "#{Rails.root}/app/styles").render
      Rails.cache.write(cache_key, rendered_styles)
      render :text => rendered_styles
    else
      render :text => cached
    end
  end

protected
  def get_includes
    result = STYLE_PACKAGES['includes'].map{ |incl| "@import #{incl}.sass\n" }.join +
             get_includes_recurse(CurrentDomain.theme_new.colors, @@site_theme_parse[:colors])

    return result
  end

  def get_includes_recurse(hash, definition, path = '')
    result = ''
    unless hash.nil?
      hash.each do |key, value|
        if definition[key.to_sym] == 'string'
          result += "!#{path}#{key} = \"#{value}\"\n"
        elsif definition[key.to_sym] == 'boolean'
          result += "!#{path}#{key} = \"#{value.to_s}\"\n"
        elsif definition[key.to_sym] == 'dimensions'
          result += "!#{path}#{key} = \"#{value[:value]}#{value[:unit]}\"\n"
        elsif definition[key.to_sym] == 'image'
          if value[:type].to_s == "static"
            href = "#{value[:href]}"
          elsif value[:type].to_s == "hosted"
            href = "/assets/#{value[:href]}"
          end
          result += "!#{path}#{key} = \"url(#{href})\"\n"
          result += "!#{path}#{key}_width = \"#{value[:width]}px\"\n"
          result += "!#{path}#{key}_height = \"#{value[:height]}px\"\n"
        elsif definition[key.to_sym] == 'color'
          if value.is_a? String
            # flat color
            result += "!color_#{path}#{key} = \"##{value}\"\n"
            result += "!#{path}#{key} = \"#{value}\"\n"
          elsif value.is_a? Array
            # gradient
            next unless value.first.is_a? Hash # hack to accomodate current header color format

            stops = value.each{ |stop| stop['position'] = stop['position'].to_f unless stop['position'].nil? }

            gradient_string = stops.map{ |stop| stop.has_key?('position') ? "#{stop['color']}:#{stop['position']}" :
                                          stop['color'] }.join(',')
            result += "!gradient_#{path}#{key} = \"#{gradient_string}\"\n"

            first_stop = stops.first
            last_stop = stops.last
            stops.delete(stops.first) if stops.first['position'].nil?
            stops.delete(stops.last) if stops.last['position'].nil?

            result += "=gradient_#{path}#{key}\n"

            # firefox
            result += "  background: -moz-linear-gradient(0 0 270deg, ##{first_stop['color']}, ##{last_stop['color']}"
            prev_stop_position = 0
            stops.each do |stop|
              stop_position = (stop['position'] * 100).round
              if prev_stop_position == stop_position
                prev_stop_position = stop_position + 1  # firefox will ignore stops with duplicate positions
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
          end
        elsif definition[key.to_sym].is_a? Hash
          result += get_includes_recurse(value, definition[key.to_sym], path + "#{key}_")
        end
      end
    end
    return result
  end

  def generate_cache_key(item)
    return "#{CurrentDomain.cname}.#{item}.#{REVISION_NUMBER}.#{CurrentDomain.default_config_id}"
  end

  @@site_theme_parse = {
    :colors     => { :links     => { :normal => 'color',
                                     :visited => 'color' },
                     :buttons   => { :active    => { :background => 'color',
                                                     :border => 'color',
                                                     :text => 'color' },
                                     :hover     => { :background => 'color',
                                                     :border => 'color',
                                                     :text => 'color' },
                                     :focus     => { :background => 'color',
                                                     :border => 'color',
                                                     :text => 'color' },
                                     :disabled  => { :background => 'color',
                                                     :border => 'color',
                                                     :text => 'color' },
                                     :shadow    => 'color' },
                     :tooltips  => { :background => 'color',
                                     :border => 'color',
                                     :shadow => 'color' } } }

  @@widget_theme_parse = {
    :frame     => { :border     => { :color => 'color',
                                     :width => 'dimensions' },
                    :color => 'color' },
    :toolbar   => { :orientation => 'string' },
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
                    :row_height => 'dimensions',
                    :zebra => 'color' }
  }
end
