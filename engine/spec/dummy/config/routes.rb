Rails.application.routes.draw do
  mount SocrataSiteChrome::Engine => '/chrome'
end
