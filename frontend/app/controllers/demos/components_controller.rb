# Demo pages for components. Not for customer usage.
# However, please note that we intentionally allow anonymous
# traffic - this allows non-engineers easy access to the demos.
class Demos::ComponentsController < ApplicationController
  skip_before_filter :require_user
  layout 'styleguide'

  def self.available_demos
    Dir.glob("#{Rails.root}/app/views/demos/components/*.html.erb").
      map { |file| File.basename(file, '.html.erb') }. # remove extension
      reject { |file| file.start_with?('_') }. # omit partials
      reject { |file| file == 'index' }. # omit index
      sort.freeze
  end

  # Override app/helpers/application_helper#modal
  def modal
  end
end
