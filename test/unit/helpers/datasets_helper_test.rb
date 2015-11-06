require 'test_helper'

require_relative '../../../app/helpers/datasets_helper'

class DatasetsHelperTest < Test::Unit::TestCase

  def setup
    init_current_domain
    @object = Object.new.tap { |object| object.extend(DatasetsHelper) }
    @view = View.new.tap { |view| view.stubs(default_view_state) }
    @object.stubs(:view => @view, :request => nil)
  end

  def test_hide_append_replace_should_be_false_when_blobby_is_true_and_new_backend_is_false
    @view.stubs( :is_blobby? => true, :new_backend? => false)
    refute @object.hide_append_replace?, 'Should be true when new_backend? is true'
    @view.stubs( :is_geo? => true, :new_backend? => false)
    refute @object.hide_append_replace?, 'Should be false when geo is true'
    @view.stubs( :is_geo? => true, :new_backend? => true)
    refute @object.hide_append_replace?, 'Should be false when geo is true and nbe is true and flag is true'
    FeatureFlags.stubs(:derive => Hashie::Mash.new(:geo_imports_to_nbe_enabled => false))
    @view.stubs( :is_geo? => true, :new_backend? => true)
    assert @object.hide_append_replace?, 'Should be true when geo is true and nbe is true and flag is false'
  end

  def test_hide_append_replace_on_feature_flag
    @view.stubs( :is_unpublished? => true, :new_backend? => true )
    assert @object.hide_append_replace?, 'Should be true when new_backend? is true'
    @view.stubs( :is_unpublished? => true, :new_backend? => false )
    FeatureFlags.stubs(:derive => Hashie::Mash.new(:ingress_strategy => 'nbe'))
    refute @object.hide_append_replace?, 'Should be false when Feature Flag is set'
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
    FeatureFlags.stubs(:derive => Hashie::Mash.new({ :reenable_ui_for_nbe => true }))
    @view.stubs(:is_published? => true, :is_api? => false, :new_backend? => true)
    refute @object.hide_embed_sdp?, 'Embed pane should not be hidden'
  end

  def test_row_identifier_select_tag
    @object.extend(ERB::Util)
    @object.extend(ActionView::Helpers)
    @object.extend(ActionView::Helpers::FormTagHelper)
    @view.stubs(:new_backend? => false, :columns => [])
    refute @object.row_identifier_select_tag =~ /disabled/, 'select_tag should not be disabled'
    @view.stubs(:new_backend? => true, :columns => [])
    refute @object.row_identifier_select_tag =~ /disabled/, 'select_tag should not be disabled'
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

    FeatureFlags.stubs(:derive => Hashie::Mash.new({ :reenable_ui_for_nbe => true }))
    @view.stubs(:is_published? => true, :is_api? => false, :dataset? => false, :new_backend? => true)
    assert @object.show_save_as_button?, 'show_save_as_button should be true for published non-api new backend non-datasets'
  end

  def test_hide_filter_dataset
    @view.stubs(:non_tabular? => false, :is_form? => false, :new_backend? => true, :is_blist? => true)
    refute @object.hide_filter_dataset?, 'Should not hide the filter dataset pane even if new backend'
    @view.stubs(:non_tabular? => true, :is_form? => false, :new_backend? => true, :is_blist? => true)
    assert @object.hide_filter_dataset?, 'Should hide the filter dataset pane for non-tabular datasets'
    @view.stubs(:non_tabular? => false, :is_form? => true, :new_backend? => true, :is_blist? => true)
    assert @object.hide_filter_dataset?, 'Should hide the filter dataset pane for forms'
  end

  def test_hide_show_hide_columns
    @view.stubs(:is_snapshotted? => false, :non_tabular? => false, :is_form? => false, :new_backend? => true, :is_geo? => false)
    refute @object.hide_show_hide_columns?, 'hide_show_hide_columns expected to be false'
    @view.stubs(:is_snapshotted? => false, :non_tabular? => false, :is_form? => false, :new_backend? => false, :is_geo? => false)
    refute @object.hide_show_hide_columns?, 'hide_show_hide_columns expected to be false'
    @view.stubs(:is_snapshotted? => false, :non_tabular? => false, :is_form? => false, :new_backend? => true, :is_geo? => true)
    assert @object.hide_show_hide_columns?, 'hide_show_hide_columns expected to be true'
    @view.stubs(:is_snapshotted? => false, :non_tabular? => false, :is_form? => true, :new_backend? => true, :is_geo? => false)
    assert @object.hide_show_hide_columns?, 'hide_show_hide_columns expected to be true'
    @view.stubs(:is_snapshotted? => false, :non_tabular? => true, :is_form? => false, :new_backend? => true, :is_geo? => false)
    assert @object.hide_show_hide_columns?, 'hide_show_hide_columns expected to be true'
    @view.stubs(:is_snapshotted? => true, :non_tabular? => false, :is_form? => false, :new_backend? => true, :is_geo? => false)
    assert @object.hide_show_hide_columns?, 'hide_show_hide_columns expected to be true'
  end

  def test_hide_update_column # aka columnOrder
    @view.stubs(:is_snapshotted? => false, :non_tabular? => false, :is_form? => false, :new_backend? => true, :is_api? => false)
    refute @object.hide_update_column?, 'hide_update_column expected to be false'
    @view.stubs(:is_snapshotted? => false, :non_tabular? => false, :is_form? => false, :new_backend? => false, :is_api? => false)
    refute @object.hide_update_column?, 'hide_update_column expected to be false'
    @view.stubs(:is_snapshotted? => false, :non_tabular? => false, :is_form? => false, :new_backend? => true, :is_api? => true)
    assert @object.hide_update_column?, 'hide_update_column expected to be true'
    @view.stubs(:is_snapshotted? => false, :non_tabular? => false, :is_form? => true, :new_backend? => true, :is_api? => false)
    assert @object.hide_update_column?, 'hide_update_column expected to be true'
    @view.stubs(:is_snapshotted? => false, :non_tabular? => true, :is_form? => false, :new_backend? => true, :is_api? => false)
    assert @object.hide_update_column?, 'hide_update_column expected to be true'
    @view.stubs(:is_snapshotted? => true, :non_tabular? => false, :is_form? => false, :new_backend? => true, :is_api? => false)
    assert @object.hide_update_column?, 'hide_update_column expected to be true'
  end

  def test_hide_data_lens_create
    # no current user
    @object.stubs(:current_user => nil)
    assert @object.hide_data_lens_create?, 'hide_data_lens_create expected to be true'

    # existing current_user
    @object.stubs(:current_user => User.new)

    # dataset is unpublished
    @view.stubs(:is_unpublished? => true, :dataset? => true)
    assert @object.hide_data_lens_create?, 'hide_data_lens_create expected to be true'

    # dataset is not table
    @view.stubs(:is_unpublished? => false, :dataset? => false)
    assert @object.hide_data_lens_create?, 'hide_data_lens_create expected to be true'

    # dataset is published and is a table
    @view.stubs(:is_unpublished? => false, :dataset? => true)

    # create_v2_data_lens feature flag is false
    FeatureFlags.stub :derive, Hashie::Mash.new(:create_v2_data_lens => false) do
      # current_user is an admin or publisher
      @object.current_user.stubs(:rights => [:edit_others_datasets])
      assert @object.hide_data_lens_create?, 'hide_data_lens_create expected to be false'

      # current_user is not an admin or publisher
      @object.current_user.stubs(:rights => [])
      assert @object.hide_data_lens_create?, 'hide_data_lens_create expected to be true'
    end

    # create_v2_data_lens feature flag is true
    FeatureFlags.stub :derive, Hashie::Mash.new(:create_v2_data_lens => true) do
      # current_user has rights
      @object.current_user.stubs(:rights => [:some_right])
      refute @object.hide_data_lens_create?, 'hide_data_lens_create expected to be false'

      # current_user has no rights
      @object.current_user.stubs(:rights => [])
      assert @object.hide_data_lens_create?, 'hide_data_lens_create expected to be true'
    end
  end

  def test_enable_xls_download_type
    FeatureFlags.stubs(:derive => Hashie::Mash.new(:enable_xls_download_type => true))
    assert @object.enable_xls_download_type, 'enable_xls_download_type to be true'
    FeatureFlags.stubs(:derive => Hashie::Mash.new(:enable_xls_download_type => false))
    refute @object.enable_xls_download_type, 'enable_xls_download_type to be false'
  end

  def test_normal_download_types
    @object.stubs(:enable_xls_download_type => true)
    assert_equal @object.normal_download_types, ['CSV', 'CSV for Excel', 'JSON', 'PDF', 'RDF', 'RSS', 'XLS', 'XLSX', 'XML']
    @object.stubs(:enable_xls_download_type => false)
    assert_equal @object.normal_download_types, ['CSV', 'CSV for Excel', 'JSON', 'PDF', 'RDF', 'RSS', 'XML']
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

