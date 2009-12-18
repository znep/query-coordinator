# Include hook code here
unless $gems_rake_task
  require 'erubis/helpers/rails_helper'
  require 'rails_xss'

  Erubis::Helpers::RailsHelper.engine_class = RailsXss::Erubis
  Erubis::Helpers::RailsHelper.show_src = false

  Module.class_eval do
    include RailsXss::SafeHelpers
  end

  require 'rails_xss_escaping'
  require 'av_patch'
end
