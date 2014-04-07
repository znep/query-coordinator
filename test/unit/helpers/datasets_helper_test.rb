require 'test_helper'

require_relative '../../../app/helpers/datasets_helper'

class DatasetsHelperTest < Test::Unit::TestCase

  def setup
    @object = Object.new.tap { |object| object.extend(DatasetsHelper) }
    @view = View.new.tap { |view| view.stubs(default_view_state) }
    @object.stubs(:view => @view)
  end

  def test_hide_append_replace_should_be_false_when_blobby_is_true_and_new_backend_is_false
    @view.stubs(
      :is_blobby? => true,
      :new_backend? => false
    )
    refute @object.hide_append_replace?, 'Should be true when new_backend? is true'
  end

  def test_hide_export_section_for_print
    @view.stubs(:can_print? => true, :new_backend? => false)
    refute @object.hide_export_section?(:print), ':print section should not be hidden'
    @view.stubs(:can_print? => false, :new_backend? => false)
    assert @object.hide_export_section?(:print), ':print section should be hidden'
    @view.stubs(:can_print? => true, :new_backend? => true)
    assert @object.hide_export_section?(:print), ':print section should be hidden'
    @view.stubs(:can_print? => false, :new_backend? => true)
    assert @object.hide_export_section?(:print), ':print section should be hidden'
  end

  def test_hide_export_section_for_odata
    @view.stubs(:is_alt_view? => false, :is_tabular? => true, :new_backend? => false)
    refute @object.hide_export_section?(:odata), ':odata section should not be hidden'
    @view.stubs(:is_alt_view? => true, :is_tabular? => true, :new_backend? => false)
    assert @object.hide_export_section?(:odata), ':odata section should be hidden'
    @view.stubs(:is_alt_view? => false, :is_tabular? => false, :new_backend? => false)
    assert @object.hide_export_section?(:odata), ':odata section should be hidden'
    @view.stubs(:is_alt_view? => false, :is_tabular? => true, :new_backend? => true)
    assert @object.hide_export_section?(:odata), ':odata section should be hidden'
  end

  def test_hide_export_section_for_api
    @view.stubs(:is_tabular? => true, :new_backend? => false)
    refute @object.hide_export_section?(:api), ':api section should not be hidden'
    @view.stubs(:is_tabular? => false, :new_backend? => false)
    assert @object.hide_export_section?(:api), ':api section should be hidden'
    @view.stubs(:is_tabular? => true, :new_backend? => true)
    refute @object.hide_export_section?(:api), ':api section should not be hidden'
    @view.stubs(:is_tabular? => false, :new_backend? => true)
    assert @object.hide_export_section?(:api), ':api section should be hidden'
  end

  def test_hide_embed_sdp
    @view.stubs(:is_published? => true, :is_api? => false, :new_backend? => false)
    refute @object.hide_embed_sdp?, 'Embed pane should not be hidden'
    @view.stubs(:is_published? => false, :is_api? => false, :new_backend? => false)
    assert @object.hide_embed_sdp?, 'Embed pane should be hidden'
    @view.stubs(:is_published? => true, :is_api? => true, :new_backend? => false)
    assert @object.hide_embed_sdp?, 'Embed pane should be hidden'
    @view.stubs(:is_published? => true, :is_api? => false, :new_backend? => true)
    assert @object.hide_embed_sdp?, 'Embed pane should be hidden'
  end

  def test_row_identifier_select_tag
    @object.extend(ERB::Util)
    @object.extend(ActionView::Helpers)
    @object.extend(ActionView::Helpers::FormTagHelper)
    @view.stubs(:new_backend? => false, :columns => [])
    refute @object.row_identifier_select_tag =~ /disabled/, 'select_tag should not be disabled'
    @view.stubs(:new_backend? => true, :columns => [])
    assert @object.row_identifier_select_tag =~ /disabled/, 'select_tag should be disabled'
  end

  def test_show_save_as_button
    @view.stubs(:is_published? => true, :is_api? => false, :dataset? => true, :new_backend? => false)
    assert @object.show_save_as_button?, 'show_save_as_button should be true for published non-api old backend datasets'
    @view.stubs(:is_published? => true, :is_api? => false, :dataset? => true, :new_backend? => true)
    assert @object.show_save_as_button?, 'show_save_as_button should be true for published non-api new backend datasets'
    @view.stubs(:is_published? => true, :is_api? => false, :dataset? => false)
    refute @object.show_save_as_button?, 'show_save_as_button should be false for published non-api non-datasets'
    @view.stubs(:is_published? => true, :is_api? => true, :dataset? => true)
    refute @object.show_save_as_button?, 'show_save_as_button should be false for published api datasets'
    @view.stubs(:is_published? => true, :is_api? => true, :dataset? => false)
    refute @object.show_save_as_button?, 'show_save_as_button should be false for published api non-datasets'
    @view.stubs(:is_published? => false, :is_api? => false, :dataset? => false)
    refute @object.show_save_as_button?, 'show_save_as_button should be false for non-published non-api non-datasets'
    @view.stubs(:is_published? => false, :is_api? => false, :dataset? => true)
    refute @object.show_save_as_button?, 'show_save_as_button should be false for non-published non-api datasets'
    @view.stubs(:is_published? => false, :is_api? => true, :dataset? => true)
    refute @object.show_save_as_button?, 'show_save_as_button should be false for non-published api datasets'
    @view.stubs(:is_published? => false, :is_api? => true, :dataset? => false)
    refute @object.show_save_as_button?, 'show_save_as_button should be false for non-published api non-datasets'
  end

  def test_hide_filter_dataset
    @view.stubs(:non_tabular? => false, :is_form? => false, :new_backend? => true, :is_blist? => true)
    refute @object.hide_filter_dataset?, 'Should not hide the filter dataset pane even if new backend'
    @view.stubs(:non_tabular? => true, :is_form? => false, :new_backend? => true, :is_blist? => true)
    assert @object.hide_filter_dataset?, 'Should hide the filter dataset pane for non-tabular datasets'
    @view.stubs(:non_tabular? => false, :is_form? => true, :new_backend? => true, :is_blist? => true)
    assert @object.hide_filter_dataset?, 'Should hide the filter dataset pane for forms'
  end

  private

  def default_view_state
    {
      :is_alt_view? => false,
      :is_tabular? => true,
      :is_unpublished? => false,
      :is_geo? => false,
      :is_blobby? => false,
      :is_href? => false,
      :flag? => true,
      :has_rights? => true
    }
  end

end
