Rails.application.routes.draw do
  mount Chrome::Engine => '/chrome'
end
