class StylesController < ApplicationController
  skip_before_filter :require_user, :set_user, :hook_auth_controller

  def individual
    includes = get_includes

    if params[:stylesheet].present? && params[:stylesheet].match(/^(\w|-)+$/)
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
      cache_key = generate_cache_key(params[:stylesheet])
      cached = Rails.cache.read(cache_key)

      if cached.nil?
        includes = get_includes
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
    cache_key = generate_cache_key('_includes')
    result = Rails.cache.read(cache_key)
    if result.nil?
      result = STYLE_PACKAGES['includes'].map{ |incl| "@import #{incl}.sass\n" }.join +
               get_includes_recurse(CurrentDomain.theme.colors, 'color_', '#') +
               get_includes_recurse(CurrentDomain.theme.dimensions, 'dimensions_')

      Rails.cache.write(cache_key, result)
    end

    return result
  end

  def get_includes_recurse(hash, prepend, value_prepend = '')
    result = ''
    unless hash.nil?
      hash.each do |key, value|
        if value.is_a? String
          result += "!#{prepend}#{key} = #{value_prepend}#{value.gsub(/\W/, '')}\n"
        elsif value.is_a? Hash
          result += get_includes_recurse(value, prepend + "#{key}_", value_prepend)
        end
      end
    end
    return result
  end

  def generate_cache_key(item)
    return "#{CurrentDomain.cname}.#{item}.#{REVISION_NUMBER}.#{CurrentDomain.default_config_id}"
  end
end
