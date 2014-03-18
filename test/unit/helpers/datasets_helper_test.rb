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
    assert @object.hide_export_section?(:api), ':api section should be hidden'
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
