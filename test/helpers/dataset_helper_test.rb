require 'test_helper'

require_relative '../../app/helpers/datasets_helper'

class ViewTest < Test::Unit::TestCase

  def test_hide_append_replace_should_be_false_when_blobby_is_true_and_new_backend_is_false
    object = Object.new
    object.extend(DatasetsHelper)
    view = View.new
    view.stubs(view_stubs.merge(:newBackend? => false))
    object.instance_variable_set('@view', view)
    refute object.hide_append_replace?, 'Should be true when newBackend? is true'
  end

  private

  def view_stubs
    {
      :is_unpublished? => false,
      :is_geo? => false,
      :is_blobby? => true,
      :is_href? => false,
      :flag? => true,
      :has_rights? => true
    }
  end

end
