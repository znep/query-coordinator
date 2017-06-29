# Demo pages for visualizations. Not for customer usage.
# However, please note that we intentionally allow anonymous
# traffic - this allows non-engineers easy access to the demos.
class Demos::VisualizationsController < ApplicationController
  skip_before_filter :require_user
  layout 'styleguide'

  def embeds
    @with_styleguide = params[:with_styleguide] == 'true'
    if @with_styleguide
      render
    else
      render :layout => 'blank'
    end
  end

  def self.available_demos
    Dir.glob("#{Rails.root}/app/views/demos/visualizations/*.html.erb").
      map { |file| File.basename(file, '.html.erb') }. # remove extension
      reject { |file| file.start_with?('_') }. # omit partials
      reject { |file| file == 'index' }. # omit index
      sort.freeze
  end
end
