# Demo pages for components. Not for customer usage.
# However, please note that we intentionally allow anonymous
# traffic - this allows non-engineers easy access to the demos.
class Demos::ComponentsController < ApplicationController
  # Each of these should correspond to a template
  # in app/views/demos/components.
  # Would be nice to automatically populate this list.
  # This list is used to automatically define routes.
  AVAILABLE_DEMOS = %w(
    color_picker
    date_range_picker
    dropdown
    edit_bar
    filter_bar
    flannel
    info_pane
    modal
    picklist
    side_menu
    slider
    socrata_icon
    view_card
  )

  #TODO check FF
  skip_before_filter :require_user
  layout 'styleguide'

  # Override app/helpers/application_helper#modal
  def modal
  end
end
