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
    includes = get_includes

    if STYLE_PACKAGES[params[:stylesheet]].present?
      sheets = STYLE_PACKAGES[params[:stylesheet]].map{ |sheet|
                 File.read("#{Rails.root}/app/styles/#{sheet}.sass") }.join("\n")

      render :text => Sass::Engine.new(includes + sheets,
                                       :style => :compressed,
                                       :cache => false,
                                       :load_paths => "#{Rails.root}/app/styles").render
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
