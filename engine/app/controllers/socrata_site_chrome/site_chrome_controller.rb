require_dependency "socrata_site_chrome/application_controller"

module SocrataSiteChrome
  class SiteChromeController < ApplicationController

    def header(args = {})
      render('/header', :locals => args).join
    end

    def footer(args = {})
      render('/footer', :locals => args).join
    end
  end
end
