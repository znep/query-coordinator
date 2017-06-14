# Demo pages for icons. Not for customer usage.
# However, please note that we intentionally allow anonymous
# traffic - this allows non-engineers easy access to the demos.
class Demos::IconsController < ApplicationController
  skip_before_filter :require_user
  layout 'styleguide'

  def index
    @icons = Dir.glob(Rails.root.join('..', 'common/resources/fonts/svg/*.svg')).map do |icon|
      File.basename(icon, '.svg')
    end
  end
end
