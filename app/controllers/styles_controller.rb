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

private
  def get_includes
    result = STYLE_PACKAGES['includes'].map{ |incl| "@import #{incl}.sass\n" }.join +
             get_includes_recurse(CurrentDomain.theme_new.colors, 'color') +
             get_includes_recurse(CurrentDomain.theme_new.dimensions, 'dimensions')

    return result
  end

  def get_includes_recurse(hash, type, path = '')
    result = ''
    unless hash.nil?
      hash.each do |key, value|
        if value.is_a? String
          # color or other static value
          result += "!color_#{path}#{key} = \"##{value}\"\n" if type == 'color'
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
        elsif value.is_a? Hash
          # subhash
          result += get_includes_recurse(value, type, path + "#{key}_")
        end
      end
    end
    return result
  end

  def generate_cache_key(item)
    return "#{CurrentDomain.cname}.#{item}.#{REVISION_NUMBER}.#{CurrentDomain.default_config_id}"
  end
end
