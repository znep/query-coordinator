require 'test_helper'

require_relative '../../../app/helpers/datasets_helper'

class DatasetsHelperTest < Test::Unit::TestCase

  def test_hide_append_replace_should_be_false_when_blobby_is_true_and_new_backend_is_false
    object = Object.new.tap { |object| object.extend(DatasetsHelper) }
    view = View.new.tap { |view| view.stubs(default_view_state.merge(:new_backend? => false)) }
    object.stubs(:view => view)
    refute object.hide_append_replace?, 'Should be true when new_backend? is true'
  end

  def test_hide_export_section_for_print
    object = Object.new.tap { |object| object.extend(DatasetsHelper) }
    view = View.new.tap { |view| view.stubs(default_view_state) }
    object.stubs(:view => view)
    view.stubs(:can_print? => true, :new_backend? => false)
    refute object.hide_export_section?(:print), ':print section should not be hidden'
    view.stubs(:can_print? => false, :new_backend? => false)
    assert object.hide_export_section?(:print), ':print section should be hidden'
    view.stubs(:can_print? => true, :new_backend? => true)
    assert object.hide_export_section?(:print), ':print section should be hidden'
    view.stubs(:can_print? => false, :new_backend? => true)
    assert object.hide_export_section?(:print), ':print section should be hidden'
  end

  def test_hide_export_section_for_odata
    object = Object.new.tap { |object| object.extend(DatasetsHelper) }
    view = View.new.tap { |view| view.stubs(default_view_state) }
    object.stubs(:view => view)
    view.stubs(:is_alt_view? => false, :is_tabular? => true, :new_backend? => false)
    refute object.hide_export_section?(:odata), ':odata section should not be hidden'
    view.stubs(:is_alt_view? => true, :is_tabular? => true, :new_backend? => false)
    assert object.hide_export_section?(:odata), ':odata section should be hidden'
    view.stubs(:is_alt_view? => false, :is_tabular? => false, :new_backend? => false)
    assert object.hide_export_section?(:odata), ':odata section should be hidden'
    view.stubs(:is_alt_view? => false, :is_tabular? => true, :new_backend? => true)
    assert object.hide_export_section?(:odata), ':odata section should be hidden'
  end

  def test_hide_export_section_for_api
    object = Object.new.tap { |object| object.extend(DatasetsHelper) }
    view = View.new.tap { |view| view.stubs(default_view_state) }
    object.stubs(:view => view)
    view.stubs(:is_tabular? => true, :new_backend? => false)
    refute object.hide_export_section?(:api), ':api section should not be hidden'
    view.stubs(:is_tabular? => false, :new_backend? => false)
    assert object.hide_export_section?(:api), ':api section should be hidden'
    view.stubs(:is_tabular? => true, :new_backend? => true)
    assert object.hide_export_section?(:api), ':api section should be hidden'
    view.stubs(:is_tabular? => false, :new_backend? => true)
    assert object.hide_export_section?(:api), ':api section should be hidden'
  end

  private

  def default_view_state
    {
      :is_alt_view? => false,
      :is_tabular? => true,
      :is_unpublished? => false,
      :is_geo? => false,
      :is_blobby? => true,
      :is_href? => false,
      :flag? => true,
      :has_rights? => true
    }
  end

end
