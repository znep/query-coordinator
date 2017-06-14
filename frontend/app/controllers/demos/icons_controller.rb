# Demo pages for icons. Not for customer usage.
# However, please note that we intentionally allow anonymous
# traffic - this allows non-engineers easy access to the demos.
class Demos::IconsController < ApplicationController
  skip_before_filter :require_user
  layout 'styleguide'

  def index
    @icons = Dir[Rails.root.join('..', 'common/resources/fonts/svg/*.svg')].map do |icon|
      icon_path = Pathname.new(icon)
      icon_path.basename.to_s.gsub(icon_path.extname, '')
    end
  end
end
