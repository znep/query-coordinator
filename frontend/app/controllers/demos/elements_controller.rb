# Demo pages for elements. Not for customer usage.
# However, please note that we intentionally allow anonymous
# traffic - this allows non-engineers easy access to the demos.
class Demos::ElementsController < ApplicationController
  skip_before_filter :require_user
  layout 'styleguide'
end
