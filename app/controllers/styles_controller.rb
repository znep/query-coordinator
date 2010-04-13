class StylesController < ApplicationController
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
      cache_key = "#{CurrentDomain.cname}.#{params[:stylesheet]}.#{REVISION_NUMBER}.#{CurrentDomain.default_config_id}"
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
    includes = STYLE_PACKAGES['includes'].map{ |incl| "@import #{incl}.sass\n" }.join
    # TODO: theme color deserialization here

    return includes
  end
end
