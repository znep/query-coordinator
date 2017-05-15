module Socrata
  module CookieHelper

    module_function

    def current_cookies=(cookies)
      Thread.current[:cookies] = cookies
    end

    def current_cookies
      Thread.current[:cookies]
    end

  end
end
