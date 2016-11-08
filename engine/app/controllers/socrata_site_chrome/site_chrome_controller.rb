require_dependency "socrata_site_chrome/application_controller"

module SocrataSiteChrome
  class SiteChromeController < ApplicationController

    def test_header(args)
      render('/test_header', :locals => { :foo => 234, :bar => args.inspect }).join
    end
  end
end
