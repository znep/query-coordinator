require 'tmpdir'
require 'digest/md5'

class StylesController < ApplicationController
  skip_before_filter :require_user, :set_user, :set_meta, :sync_logged_in_cookie, :poll_external_configs

  # Only used in development
  def individual
    path = params[:path]

    if path.present? && path.match(/^(\w|-|\.|\/)+$/)
      style_path_parts = [
        Rails.root,
        'app/styles'
      ]

      headers['Content-Type'] = 'text/css'

      scss_stylesheet_filename = File.join(style_path_parts + ["#{path}.scss"])
      css_stylesheet_filename = File.join(style_path_parts + ["#{path}.css"])

      # We have 2 cases:
      #  - The extension is .css. Return the css file.
      #  - The extension is .scss. Compile the scss template, cache its
      #    output and return it.

      if File.exist?(scss_stylesheet_filename)
        with_development_cache(scss_stylesheet_filename) do
          stylesheet = File.read(scss_stylesheet_filename)
          includes = get_includes
          Sass::Engine.new(includes + stylesheet,
                           :style => :nested,
                           :syntax => :scss,
                           :cache => false,
                           :load_paths => ["#{Rails.root}/app/styles"]).render
        end
      elsif File.exist?(css_stylesheet_filename)
        render :text => File.read(css_stylesheet_filename)
      else
        # Someone asked for a stylesheet that didn't exist.
        render :nothing => true, :status => :not_found
      end
    else
      # someone's up to no good.
      render :nothing => true, :status => :not_found
    end
  end

  def merged
    if STYLE_PACKAGES[params[:stylesheet]].present?
      headers['Content-Type'] = 'text/css'
      headers['Cache-Control'] = "public, max-age=604800"

      cache_key = generate_cache_key(params[:stylesheet])
      cached = Rails.cache.read(cache_key)

      if cached.nil?
        includes_cache_key = generate_cache_key('_includes')
        includes = Rails.cache.read(includes_cache_key)
        if includes.nil?
          includes = get_includes
          Rails.cache.write(includes_cache_key, includes)
        end

        rendered_styles = render_merged_stylesheets(includes)

        Rails.cache.write(cache_key, rendered_styles)
        render :text => rendered_styles
      else
        render :text => cached
      end
    else
      render :nothing => true, :status => :not_found, :content_type => 'text/css'
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
      render :nothing => true, :status => :not_found, :content_type => 'text/css'
    end
    headers['Content-Type'] = 'text/css'

    cache_key = generate_cache_key("widget.#{params[:customization_id]}.#{updated_at || 0}")
    cached = Rails.cache.read(cache_key) unless use_discrete_assets?

    if cached.nil?
      # get sitewide includes
      includes_cache_key = generate_cache_key('_includes')
      includes = Rails.cache.read(includes_cache_key) unless use_discrete_assets?
      if includes.nil?
        includes = get_includes
        Rails.cache.write(includes_cache_key, includes)
      end

      # get widget includes
      includes += get_includes_recurse(theme, @@widget_theme_parse)

      # render
      sheet = File.read("#{Rails.root}/app/styles/widget.scss")
      rendered_styles = Sass::Engine.new(includes + sheet,
                                         :style => :compressed,
                                         :syntax => :scss,
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
    headers['Cache-Control'] = "public, max-age=604800"
    render :text => CurrentDomain.properties.custom_css
  end

  def govstat_site
    headers['Content-Type'] = 'text/css'
    headers['Cache-Control'] = "public, max-age=604800"
    render :text => CurrentDomain.properties.govstat_css
  end

  protected

  def render_merged_stylesheets(includes)
    scss_sheets = []
    css_sheets = []
    STYLE_PACKAGES[params[:stylesheet]].each do |sheet|
      fname = "#{Rails.root}/app/styles/#{sheet}.scss"
      if File.exist?(fname)
        scss_sheets.push(File.read(fname))
      else
        fname = "#{Rails.root}/app/styles/#{sheet}.css"
        css_sheets.push(File.read(fname))
      end
    end

    rendered_styles = css_sheets.join("\n")
    rendered_styles << Sass::Engine.new(
      includes + scss_sheets.join("\n"),
      :style => :compressed,
      :syntax => :scss,
      :cache => false,
      :load_paths => ["#{Rails.root}/app/styles"]
    ).render

    # Wow, this is super important. Since stylesheets come from heterogenous
    # sources, and some of them might be utf-8, something (Ruby?) is going way
    # overboard adding BOMs willy nilly when we concatenate the contents of
    # each stylesheet. Accordingly, we need to use strip_byte_order_mark! to
    # search and destroy BOMs throughout the file (remember, there might be
    # many since we're concatenating a bunch of files together). Yuck!
    strip_byte_order_marks!(rendered_styles)
  end

  def strip_byte_order_marks!(string)
    string.gsub!("\xEF\xBB\xBF".force_encoding('utf-8'), '')
  end

  def get_includes
    STYLE_PACKAGES['includes'].map do |incl|
      "@import \"#{incl}.scss\";\n"
    end.join + get_includes_recurse(CurrentDomain.theme, @@site_theme_parse)
  end

  def with_development_cache(stylesheet_filename)
    if use_discrete_assets?
      tmpdir_path = File.join(Dir.tmpdir, 'blist_style_cache')
      Dir.mkdir(tmpdir_path) unless Dir.exist? tmpdir_path

      includes_cache_key = STYLE_PACKAGES['includes'].map do |include|
        File.new(File.join(Rails.root, 'app/styles', "#{include}.scss")).mtime.to_s
      end.join

      cache_key = Digest::MD5.hexdigest(stylesheet_filename + includes_cache_key +
                    File.new(stylesheet_filename).mtime.to_s + CurrentDomain.cname)
      cache_path = File.join(tmpdir_path, cache_key)

      if stylesheet_or_siblings_newer_than_cache?(stylesheet_filename, cache_path)
        File.unlink(cache_path)
      end

      if File.exist?(cache_path)
        Rails.logger.debug "Reading cached stylesheet from #{cache_path}"
        render :text => File.read(cache_path)
      else
        result = yield
        File.open(cache_path, 'w') { |f| f.write result }
        render :text => result
      end
    else
      render :text => yield
    end
  end

  def stylesheet_or_siblings_newer_than_cache?(stylesheet, cached_file)
    return false unless File.exist?(cached_file)

    cached_file_mtime = File.mtime(cached_file)
    stylesheet_dir = File.dirname(stylesheet)
    Dir.glob(File.join("#{stylesheet_dir}/**", "*.*ss")).any? do |file|
      File.mtime(file) >= cached_file_mtime
    end
  end

  def normalize_color(color, want_pound = true)
    if want_pound
      color.start_with?('#') ? color : "##{color}"
    else
      color.start_with?('#') ? color[1..-1] : color
    end
  end

  def get_gradient_definition(name, value)
    result = ''

    stops = value.each{ |stop| stop['position'] =
      stop['position'].to_f unless stop['position'].nil? }

    gradient_string = stops.map{ |stop| stop.has_key?('position') ?
      "#{normalize_color(stop['color'], false)}:#{stop['position']}" : normalize_color(stop['color'], false) }.join(',')

    # ie (based on raw string)
    result += "@mixin box_gradient_#{name}($width, $height, $additional) {\n"
    result += '  background-image: url(/ui/box.png?w=#{$width}&h=#{$height}&fc=' +
                 gradient_string + '&#{$additional});' + "\n" +
              "}\n"

    first_stop = stops.first
    last_stop = stops.last
    stops.delete(stops.first) if stops.first['position'].nil?
    stops.delete(stops.last) if stops.last['position'].nil?

    result += "@mixin gradient_#{name} {\n"

    first_color = normalize_color(first_stop['color'])
    last_color = normalize_color(last_stop['color'])
    # firefox
    result += "  background: -moz-linear-gradient(0 0 270deg, #{first_color}, #{last_color}"
    prev_stop_position = 0
    stops.each do |stop|
      stop_position = (stop['position'] * 100).round
      if prev_stop_position == stop_position
        # firefox will ignore stops with duplicate positions
        prev_stop_position = stop_position + 1
      else
        prev_stop_position = stop_position
      end

      result += ", #{normalize_color(stop['color'])} #{prev_stop_position}%"
    end
    result += ");\n"

    # webkit
    result += '  background: -webkit-gradient(linear, left top, left bottom,' +
              " from(#{first_color}), to(#{last_color})" +
              stops.map{ |stop| ", color-stop(#{stop['position']},#{normalize_color(stop['color'])})" }.join +
              ");\n"

    # default background-color for fallback
    result += "  background-color: #{first_color};\n"
    result + "}\n"
  end

  def get_includes_recurse(hash, definition, path = '')
    result = ''
    unless hash.nil?
      hash.with_indifferent_access.each do |key, value|
        if definition[key.to_sym] == 'string'
          result += "$#{path}#{key}: \"#{value}\";\n"
        elsif definition[key.to_sym] == 'number'
          result += "$#{path}#{key}: #{value};\n"
        elsif definition[key.to_sym] == 'boolean'
          result += "$#{path}#{key}: #{value.to_s};\n"
        elsif definition[key.to_sym] == 'dimensions'
          result += "$#{path}#{key}: #{value[:value]}#{value[:unit]};\n"
        elsif definition[key.to_sym] == 'image'
          if value[:type].to_s == 'static'
            href = "#{value[:href]}"
          elsif value[:type].to_s == 'hosted'
            href = "/assets/#{value[:href]}"
          end
          result += "$#{path}#{key}: url(#{href});\n"
          result += "$#{path}#{key}_width: #{value[:width]}px;\n"
          result += "$#{path}#{key}_height: #{value[:height]}px;\n"
        elsif definition[key.to_sym] == 'color'
          if value.is_a? String
            # flat color
            if value.match(/([0-9a-f]{3}){1,2}/i) && !value.start_with?('#')
              # hex color (prepend #)
              result += "$color_#{path}#{key}: ##{value};\n"
            else
              # rgba color (pass through)
              result += "$color_#{path}#{key}: #{value};\n"
            end
            result += "$#{path}#{key}: #{value};\n"
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

    result
  end

  def generate_cache_key(item)
    "%s.%s.%s.%s.%s" % [
      CurrentDomain.cname,
      item,
      REVISION_NUMBER,
      CurrentDomain.default_config_id,
      CurrentDomain.default_config_updated_at
    ]
  end

  @@site_theme_parse = {
    :links     => { :normal      => 'color',
                    :visited     => 'color' },
    :buttons   => { :active      => { :background  => 'color',
                                      :border      => 'color',
                                      :shadow      => 'color',
                                      :text        => 'color' },
                    :disabled    => { :background  => 'color',
                                      :border      => 'color',
                                      :text        => 'color' },
                    :default     => { :background  => 'color',
                                      :border      => 'color',
                                      :text        => 'color' },
                    :default_disabled =>
                                    { :background  => 'color',
                                      :border      => 'color',
                                      :text        => 'color' } },
    :table     => { :header      => { :inactive    => 'color',
                                      :active      => 'color' } },
    :text      => { :error       => 'color' },
    :images    => { :logo_header => 'image',
                    :logo_footer => 'image' },
    :chrome    => { :background  => 'color',
                    :box_border  => 'color',
                    :margin      => { :inner       => 'dimensions',
                                      :outer       => 'dimensions' },
                    :sidebar     => { :background  => 'color',
                                      :text        => 'color' },
                    :nav_buttons => { :background  => 'color',
                                      :border      => 'color' } },
    :stories   => { :orientation => 'string',
                    :height      => 'dimensions',
                    :pager       => { :type        => 'string',
                                      :position    => 'string',
                                      :disposition => 'string' },
                    :box         => { :alpha       => 'number',
                                      :color       => 'color',
                                      :margin      => 'dimensions',
                                      :shadow      => 'number',
                                      :width       => 'dimensions',
                                      :headline    => { :color => 'color',
                                                        :font_family => 'string',
                                                        :font_size   => 'dimensions',
                                                        :shadow      => { :radius => 'dimensions',
                                                                          :alpha => 'number' } },
                                      :body        => { :color => 'color',
                                                        :font_family => 'string',
                                                        :font_size   => 'dimensions',
                                                        :shadow      => { :radius => 'dimensions',
                                                                          :alpha => 'number' } } } } }

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
