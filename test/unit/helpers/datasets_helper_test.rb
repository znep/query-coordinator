require 'test_helper'

require_relative '../../../app/helpers/datasets_helper'

class DatasetsHelperTest < Test::Unit::TestCase

  def setup
    init_current_domain
    @object = Object.new.tap { |object| object.extend(DatasetsHelper) }
    @view = View.new.tap { |view| view.stubs(default_view_state) }
    @object.stubs(:view => @view, :request => nil)
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

  def test_hide_redirect
    @object.stubs(:force_editable? => true)
    refute @object.send(:hide_redirect?), 'should not be hidden when force_editable? is true'
    @object.stubs(:force_editable? => false, :current_user => User.new)
    @view.stubs(:is_published? => true, :is_blist? => true, :can_edit? => true, :is_immutable? => false)
    refute @object.send(:hide_redirect?), 'should not be hidden'
    @view.stubs(:is_published? => false, :is_blist? => true, :can_edit? => true, :is_immutable? => false)
    assert @object.send(:hide_redirect?), 'should be hidden'
    @view.stubs(:is_published? => true, :is_blist? => false, :can_edit? => true, :is_immutable? => false)
    assert @object.send(:hide_redirect?), 'should be hidden'
    @view.stubs(:is_published? => true, :is_blist? => true, :can_edit? => false, :is_immutable? => false)
    assert @object.send(:hide_redirect?), 'should be hidden'
    @view.stubs(:is_published? => true, :is_blist? => true, :can_edit? => true, :is_immutable? => true)
    assert @object.send(:hide_redirect?), 'should be hidden'
    @object.stubs(:current_user => nil)
    @view.stubs(:is_published? => true, :is_blist? => true, :can_edit? => true, :is_immutable? => false)
    assert @object.send(:hide_redirect?), 'should be hidden'
  end

  def test_hide_add_column
    @view.stubs(:is_unpublished? => true, :is_blist? => true, :has_rights? => true, :is_immutable? => false, :geoParent => nil)
    refute @object.send(:hide_add_column?), 'should not be hidden'
    @view.stubs(:is_unpublished? => false, :is_blist? => true, :has_rights? => true, :is_immutable? => false, :geoParent => nil)
    assert @object.send(:hide_add_column?), 'should be hidden'
    @view.stubs(:is_unpublished? => true, :is_blist? => false, :has_rights? => true, :is_immutable? => false, :geoParent => nil)
    assert @object.send(:hide_add_column?), 'should be hidden'
    @view.stubs(:is_unpublished? => true, :is_blist? => true, :has_rights? => false, :is_immutable? => false, :geoParent => nil)
    assert @object.send(:hide_add_column?), 'should be hidden'
    @view.stubs(:is_unpublished? => true, :is_blist? => true, :has_rights? => true, :is_immutable? => true, :geoParent => nil)
    assert @object.send(:hide_add_column?), 'should be hidden'
    @view.stubs(:is_unpublished? => true, :is_blist? => true, :has_rights? => true, :is_immutable? => false, :geoParent => Model.new)
    assert @object.send(:hide_add_column?), 'should be hidden'
  end

  def test_hide_append_replace
    @view.stubs(:is_blobby? => true, :new_backend? => false)
    refute @object.send(:hide_append_replace?), 'Should be true when new_backend? is true'
    @view.stubs(:is_geo? => true, :new_backend? => false)
    refute @object.send(:hide_append_replace?), 'Should be false when geo is true'
    @view.stubs(:is_geo? => true, :new_backend? => true)
    refute @object.send(:hide_append_replace?), 'Should be false when geo is true and nbe is true and flag is true'
    FeatureFlags.stubs(:derive => Hashie::Mash.new(:geo_imports_to_nbe_enabled => false))
    @view.stubs(:is_geo? => true, :new_backend? => true)
    assert @object.send(:hide_append_replace?), 'Should be true when geo is true and nbe is true and flag is false'
    @view.stubs(:is_unpublished? => true, :new_backend? => true )
    assert @object.send(:hide_append_replace?), 'Should be true when new_backend? is true'
    @view.stubs(:is_unpublished? => true, :new_backend? => false )
    FeatureFlags.stubs(:derive => Hashie::Mash.new(:ingress_strategy => 'nbe'))
    refute @object.send(:hide_append_replace?), 'Should be false when Feature Flag is set'
  end

  def test_hide_export_section_for_print
    @view.stubs(:can_print? => true, :new_backend? => false)
    refute @object.send(:hide_export_section?, :print), ':print section should not be hidden'
    @view.stubs(:can_print? => false, :new_backend? => false)
    assert @object.send(:hide_export_section?, :print), ':print section should be hidden'
    @view.stubs(:can_print? => true, :new_backend? => true)
    assert @object.send(:hide_export_section?, :print), ':print section should be hidden'
    @view.stubs(:can_print? => false, :new_backend? => true)
    assert @object.send(:hide_export_section?, :print), ':print section should be hidden'
  end

  def test_hide_export_section_for_download
    @view.stubs(:is_tabular? => true, :is_geo? => false, :is_form? => false)
    refute @object.send(:hide_export_section?, :download), ':download section should not be hidden'
    @view.stubs(:is_tabular? => false, :is_geo? => true, :is_form? => false)
    refute @object.send(:hide_export_section?, :download), ':download section should not be hidden'
    @view.stubs(:is_tabular? => false, :is_geo? => false, :is_form? => false)
    assert @object.send(:hide_export_section?, :download), ':download section should be hidden'
    @view.stubs(:is_tabular? => true, :is_geo? => false, :is_form? => true)
    assert @object.send(:hide_export_section?, :download), ':download section should be hidden'
  end

  def test_hide_export_section_for_api
    @view.stubs(:is_tabular? => true)
    refute @object.send(:hide_export_section?, :api), ':api section should not be hidden'
    @view.stubs(:is_tabular? => false)
    assert @object.send(:hide_export_section?, :api), ':api section should be hidden'
  end

  def test_hide_export_section_for_odata
    @view.stubs(:is_alt_view? => false, :is_tabular? => true, :new_backend? => false)
    refute @object.send(:hide_export_section?, :odata), ':odata section should not be hidden'
    @view.stubs(:is_alt_view? => true, :is_tabular? => true, :new_backend? => false)
    assert @object.send(:hide_export_section?, :odata), ':odata section should be hidden'
    @view.stubs(:is_alt_view? => false, :is_tabular? => false, :new_backend? => false)
    assert @object.send(:hide_export_section?, :odata), ':odata section should be hidden'
    @view.stubs(:is_alt_view? => false, :is_tabular? => true, :new_backend? => true)
    assert @object.send(:hide_export_section?, :odata), ':odata section should be hidden'
  end

  def test_hide_export_section_for_subscribe
    @view.stubs(:is_published? => true, :is_tabular? => true, :is_api? => false, :is_form? => false)
    refute @object.send(:hide_export_section?, :subscribe), ':subscribe section should not be hidden'
    @view.stubs(:is_published? => false, :is_tabular? => true, :is_api? => false, :is_form? => false)
    assert @object.send(:hide_export_section?, :subscribe), ':subscribe section should be hidden'
    @view.stubs(:is_published? => true, :is_tabular? => false, :is_api? => false, :is_form? => false)
    assert @object.send(:hide_export_section?, :subscribe), ':subscribe section should be hidden'
    @view.stubs(:is_published? => true, :is_tabular? => true, :is_api? => true, :is_form? => false)
    assert @object.send(:hide_export_section?, :subscribe), ':subscribe section should be hidden'
    @view.stubs(:is_published? => true, :is_tabular? => true, :is_api? => false, :is_form? => true)
    assert @object.send(:hide_export_section?, :subscribe), ':subscribe section should be hidden'
  end

  def test_hide_embed_sdp
    @view.stubs(:is_published? => true, :is_api? => false, :new_backend? => false)
    refute @object.send(:hide_embed_sdp?), 'Embed pane should not be hidden'
    @view.stubs(:is_published? => false, :is_api? => false, :new_backend? => false)
    assert @object.send(:hide_embed_sdp?), 'Embed pane should be hidden'
    @view.stubs(:is_published? => true, :is_api? => true, :new_backend? => false)
    assert @object.send(:hide_embed_sdp?), 'Embed pane should be hidden'
    @view.stubs(:is_published? => true, :is_api? => false, :new_backend? => true)
    assert @object.send(:hide_embed_sdp?), 'Embed pane should be hidden'
    FeatureFlags.stubs(:derive => Hashie::Mash.new({ :reenable_ui_for_nbe => true }))
    @view.stubs(:is_published? => true, :is_api? => false, :new_backend? => true)
    refute @object.send(:hide_embed_sdp?), 'Embed pane should not be hidden'
  end

  def test_hide_conditional_formatting
    @view.stubs(:is_unpublished? => false, :non_tabular? => false, :is_form? => false, :is_api? => false, :geoParent => nil)
    refute @object.send(:hide_conditional_formatting?), 'should not be hidden'
    @view.stubs(:is_unpublished? => true, :non_tabular? => false, :is_form? => false, :is_api? => false, :geoParent => nil)
    assert @object.send(:hide_conditional_formatting?), 'should be hidden'
    @view.stubs(:is_unpublished? => false, :non_tabular? => true, :is_form? => false, :is_api? => false, :geoParent => nil)
    assert @object.send(:hide_conditional_formatting?), 'should be hidden'
    @view.stubs(:is_unpublished? => false, :non_tabular? => false, :is_form? => true, :is_api? => false, :geoParent => nil)
    assert @object.send(:hide_conditional_formatting?), 'should be hidden'
    @view.stubs(:is_unpublished? => false, :non_tabular? => false, :is_form? => false, :is_api? => true, :geoParent => nil)
    assert @object.send(:hide_conditional_formatting?), 'should be hidden'
    @view.stubs(:is_unpublished? => false, :non_tabular? => false, :is_form? => false, :is_api? => false, :geoParent => Model.new)
    assert @object.send(:hide_conditional_formatting?), 'should be hidden'
  end

  def test_hide_form_create
    CurrentDomain.stubs(:user_can? => false)
    @object.stubs(:current_user => User.new)

    # current user does own
    @view.stubs(:owned_by? => true, :parent_dataset => nil)

    @view.stubs(:is_published? => true, :non_tabular? => false, :is_form? => true, :is_api? => false, :geoParent => nil, :is_grouped? => false)
    refute @object.send(:hide_form_create?), 'should not be hidden'
    @view.stubs(:is_published? => false, :non_tabular? => false, :is_form? => true, :is_api? => false, :geoParent => nil, :is_grouped? => false)
    assert @object.send(:hide_form_create?), 'should be hidden'
    @view.stubs(:is_published? => true, :non_tabular? => true, :is_form? => false, :is_api? => false, :geoParent => nil, :is_grouped? => false)
    assert @object.send(:hide_form_create?), 'should be hidden'
    @view.stubs(:is_published? => true, :non_tabular? => false, :is_form? => true, :is_api? => true, :geoParent => nil, :is_grouped? => false)
    assert @object.send(:hide_form_create?), 'should be hidden'
    @view.stubs(:is_published? => true, :non_tabular? => false, :is_form? => true, :is_api? => false, :geoParent => Model.new, :is_grouped? => false)
    assert @object.send(:hide_form_create?), 'should be hidden'
    @view.stubs(:is_published? => true, :non_tabular? => false, :is_form? => true, :is_api? => false, :geoParent => nil, :is_grouped? => true)
    assert @object.send(:hide_form_create?), 'should be hidden'

    # current user does not own
    @view.stubs(:owned_by? => false)

    @view.stubs(:is_published => true, :non_tabular? => false, :is_form? => true, :is_api? => false, :geoParent => nil, :is_grouped => false)
    assert @object.send(:hide_form_create?), 'should be hidden'

  end

  def test_hide_api_foundry
    FeatureFlags.stubs(:derive => Hashie::Mash.new(:enable_api_foundry_pane => false))
    assert @object.send(:hide_api_foundry?), 'should be hidden if the feature flag is disabled'
    FeatureFlags.stubs(:derive => Hashie::Mash.new(:enable_api_foundry_pane => true))
    @object.stubs(:module_enabled? => true)
    @view.stubs(:is_blist? => true, :is_api? => true, :is_published? => true, :has_rights? => true, :can_publish? => true, :new_backend? => false, :is_arcgis? => false, :geoParent => nil)
    refute @object.send(:hide_api_foundry?), 'should not be hidden'
    @view.stubs(:is_blist? => false, :is_api? => false, :is_published? => true, :has_rights? => true, :can_publish? => true, :new_backend? => false, :is_arcgis? => false, :geoParent => nil)
    assert @object.send(:hide_api_foundry?), 'should be hidden'
    @view.stubs(:is_blist? => true, :is_api? => true, :is_published? => false, :has_rights? => true, :can_publish? => true, :new_backend? => false, :is_arcgis? => false, :geoParent => nil)
    assert @object.send(:hide_api_foundry?), 'should be hidden'
    @view.stubs(:is_blist? => true, :is_api? => true, :is_published? => true, :has_rights? => false, :can_publish? => true, :new_backend? => false, :is_arcgis? => false, :geoParent => nil)
    assert @object.send(:hide_api_foundry?), 'should be hidden'
    @view.stubs(:is_blist? => true, :is_api? => true, :is_published? => true, :has_rights? => true, :can_publish? => false, :new_backend? => false, :is_arcgis? => false, :geoParent => nil)
    assert @object.send(:hide_api_foundry?), 'should be hidden'
    @view.stubs(:is_blist? => true, :is_api? => true, :is_published? => true, :has_rights? => true, :can_publish? => true, :new_backend? => true, :is_arcgis? => false, :geoParent => nil)
    assert @object.send(:hide_api_foundry?), 'should be hidden'
    @view.stubs(:is_blist? => true, :is_api? => true, :is_published? => true, :has_rights? => true, :can_publish? => true, :new_backend? => false, :is_arcgis? => true, :geoParent => nil)
    assert @object.send(:hide_api_foundry?), 'should be hidden'
    @view.stubs(:is_blist? => true, :is_api? => true, :is_published? => true, :has_rights? => true, :can_publish? => true, :new_backend? => false, :is_arcgis? => false, :geoParent => Model.new)
    assert @object.send(:hide_api_foundry?), 'should be hidden'
    @object.stubs(:module_enabled? => false)
    @view.stubs(:is_blist? => true, :is_api? => true, :is_published? => true, :has_rights? => true, :can_publish? => true, :new_backend? => false, :is_arcgis? => false, :geoParent => nil)
    assert @object.send(:hide_api_foundry?), 'should be hidden'
  end

  def test_hide_update_column # aka columnOrder
    @view.stubs(:is_snapshotted? => false, :non_tabular? => false, :is_form? => false, :new_backend? => true, :is_api? => false)
    refute @object.send(:hide_update_column?), 'hide_update_column expected to be false'
    @view.stubs(:is_snapshotted? => false, :non_tabular? => false, :is_form? => false, :new_backend? => false, :is_api? => false)
    refute @object.send(:hide_update_column?), 'hide_update_column expected to be false'
    @view.stubs(:is_snapshotted? => false, :non_tabular? => false, :is_form? => false, :new_backend? => true, :is_api? => true)
    assert @object.send(:hide_update_column?), 'hide_update_column expected to be true'
    @view.stubs(:is_snapshotted? => false, :non_tabular? => false, :is_form? => true, :new_backend? => true, :is_api? => false)
    assert @object.send(:hide_update_column?), 'hide_update_column expected to be true'
    @view.stubs(:is_snapshotted? => false, :non_tabular? => true, :is_form? => false, :new_backend? => true, :is_api? => false)
    assert @object.send(:hide_update_column?), 'hide_update_column expected to be true'
    @view.stubs(:is_snapshotted? => true, :non_tabular? => false, :is_form? => false, :new_backend? => true, :is_api? => false)
    assert @object.send(:hide_update_column?), 'hide_update_column expected to be true'
  end

  def test_hide_show_hide_columns
    @view.stubs(:is_snapshotted? => false, :non_tabular? => false, :is_form? => false, :new_backend? => true, :is_geo? => false)
    refute @object.send(:hide_show_hide_columns?), 'hide_show_hide_columns expected to be false'
    @view.stubs(:is_snapshotted? => false, :non_tabular? => false, :is_form? => false, :new_backend? => false, :is_geo? => false)
    refute @object.send(:hide_show_hide_columns?), 'hide_show_hide_columns expected to be false'
    @view.stubs(:is_snapshotted? => false, :non_tabular? => false, :is_form? => false, :new_backend? => true, :is_geo? => true)
    assert @object.send(:hide_show_hide_columns?), 'hide_show_hide_columns expected to be true'
    @view.stubs(:is_snapshotted? => false, :non_tabular? => false, :is_form? => true, :new_backend? => true, :is_geo? => false)
    assert @object.send(:hide_show_hide_columns?), 'hide_show_hide_columns expected to be true'
    @view.stubs(:is_snapshotted? => false, :non_tabular? => true, :is_form? => false, :new_backend? => true, :is_geo? => false)
    assert @object.send(:hide_show_hide_columns?), 'hide_show_hide_columns expected to be true'
    @view.stubs(:is_snapshotted? => true, :non_tabular? => false, :is_form? => false, :new_backend? => true, :is_geo? => false)
    assert @object.send(:hide_show_hide_columns?), 'hide_show_hide_columns expected to be true'
  end

  def test_hide_sharing
    @view.stubs(:is_snapshotted? => false, :has_rights? => true, :geoParent => nil)
    refute @object.send(:hide_sharing?), 'should not be hidden'
    @view.stubs(:is_snapshotted? => true, :has_rights? => true, :geoParent => nil)
    assert @object.send(:hide_sharing?), 'should be hidden'
    @view.stubs(:is_snapshotted? => false, :has_rights? => false, :geoParent => nil)
    assert @object.send(:hide_sharing?), 'should be hidden'
    @view.stubs(:is_snapshotted? => false, :has_rights? => true, :geoParent => Model.new)
    assert @object.send(:hide_sharing?), 'should be hidden'
  end

  def test_hide_permissions
    @view.stubs(:is_snapshotted? => false, :has_rights? => true, :geoParent => nil)
    refute @object.send(:hide_permissions?), 'should not be hidden'
    @view.stubs(:is_snapshotted? => true, :has_rights? => true, :geoParent => nil)
    assert @object.send(:hide_permissions?), 'should be hidden'
    @view.stubs(:is_snapshotted? => false, :has_rights? => false, :geoParent => nil)
    assert @object.send(:hide_permissions?), 'should be hidden'
    @view.stubs(:is_snapshotted? => false, :has_rights? => true, :geoParent => Model.new)
    assert @object.send(:hide_permissions?), 'should be hidden'
  end

  def test_hide_plagiarize
    @object.stubs(:current_user => User.new)

    CurrentDomain.stubs(:user_can? => true)
    @view.stubs(:geoParent => nil)
    refute @object.send(:hide_plagiarize?), 'should not be hidden'
    CurrentDomain.stubs(:user_can? => false)
    @view.stubs(:geoParent => nil)
    assert @object.send(:hide_plagiarize?), 'should be hidden'
    CurrentDomain.stubs(:user_can? => true)
    @view.stubs(:geoParent => Model.new)
    assert @object.send(:hide_plagiarize?), 'should be hidden'
  end

  def test_hide_delete_dataset
    @view.stubs(:has_rights? => true, :geoParent => nil)
    refute @object.send(:hide_delete_dataset?), 'should not be hidden'
    @view.stubs(:has_rights? => false, :geoParent => nil)
    assert @object.send(:hide_delete_dataset?), 'should be hidden'
    @view.stubs(:has_rights? => false, :geoParent => Model.new)
    assert @object.send(:hide_delete_dataset?), 'should be hidden'
  end

  def test_hide_filter_dataset
    @view.stubs(:non_tabular? => false, :is_form? => false, :new_backend? => true, :is_blist? => true)
    refute @object.send(:hide_filter_dataset?), 'Should not hide the filter dataset pane even if new backend'
    @view.stubs(:non_tabular? => true, :is_form? => false, :new_backend? => true, :is_blist? => true)
    assert @object.send(:hide_filter_dataset?), 'Should hide the filter dataset pane for non-tabular datasets'
    @view.stubs(:non_tabular? => false, :is_form? => true, :new_backend? => true, :is_blist? => true)
    assert @object.send(:hide_filter_dataset?), 'Should hide the filter dataset pane for forms'
  end

  def test_hide_calendar_create
    @view.stubs(:is_unpublished? => false, :is_alt_view? => true, :available_display_types => ['calendar'], :geoParent => nil)
    refute @object.send(:hide_calendar_create?), 'should not be hidden'
    @view.stubs(:is_unpublished? => false, :is_alt_view? => false, :available_display_types => [], :geoParent => nil)
    refute @object.send(:hide_calendar_create?), 'should not be hidden'
    @view.stubs(:is_unpublished? => true, :is_alt_view? => false, :available_display_types => [], :geoParent => nil)
    assert @object.send(:hide_calendar_create?), 'should be hidden'
    @view.stubs(:is_unpublished? => false, :is_alt_view? => true, :available_display_types => [], :geoParent => nil)
    assert @object.send(:hide_calendar_create?), 'should be hidden'
    @view.stubs(:is_unpublished? => false, :is_alt_view? => false, :available_display_types => [], :geoParent => Model.new)
    assert @object.send(:hide_calendar_create?), 'should be hidden'
  end

  def test_hide_chart_create
    @view.stubs(:is_unpublished? => false, :is_alt_view? => true, :available_display_types => ['chart'], :geoParent => nil)
    refute @object.send(:hide_chart_create?), 'should not be hidden'
    @view.stubs(:is_unpublished? => false, :is_alt_view? => false, :available_display_types => [], :geoParent => nil)
    refute @object.send(:hide_chart_create?), 'should not be hidden'
    @view.stubs(:is_unpublished? => true, :is_alt_view? => false, :available_display_types => [], :geoParent => nil)
    assert @object.send(:hide_chart_create?), 'should be hidden'
    @view.stubs(:is_unpublished? => false, :is_alt_view? => true, :available_display_types => [], :geoParent => nil)
    assert @object.send(:hide_chart_create?), 'should be hidden'
    @view.stubs(:is_unpublished? => false, :is_alt_view? => false, :available_display_types => [], :geoParent => Model.new)
    assert @object.send(:hide_chart_create?), 'should be hidden'
  end

  def test_hide_map_create
    @view.stubs(:is_unpublished? => false, :is_alt_view? => true, :available_display_types => ['map'], :geoParent => nil)
    refute @object.send(:hide_map_create?), 'should not be hidden'
    @view.stubs(:is_unpublished? => false, :is_alt_view? => false, :available_display_types => [], :geoParent => nil)
    refute @object.send(:hide_map_create?), 'should not be hidden'
    @view.stubs(:is_unpublished? => true, :is_alt_view? => false, :available_display_types => [], :geoParent => nil)
    assert @object.send(:hide_map_create?), 'should be hidden'
    @view.stubs(:is_unpublished? => false, :is_alt_view? => true, :available_display_types => [], :geoParent => nil)
    assert @object.send(:hide_map_create?), 'should be hidden'
    @view.stubs(:is_unpublished? => false, :is_alt_view? => false, :available_display_types => [], :geoParent => Model.new)
    assert @object.send(:hide_map_create?), 'should be hidden'
  end

  def test_hide_data_lens_create
    # no current user
    @object.stubs(:current_user => nil)
    assert @object.send(:hide_data_lens_create?), 'hide_data_lens_create expected to be true'

    # existing current_user
    @object.stubs(:current_user => User.new)

    # dataset is unpublished
    @view.stubs(:is_unpublished? => true, :dataset? => true)
    assert @object.send(:hide_data_lens_create?), 'hide_data_lens_create expected to be true'

    # dataset is not table
    @view.stubs(:is_unpublished? => false, :dataset? => false)
    assert @object.send(:hide_data_lens_create?), 'hide_data_lens_create expected to be true'

    # dataset is published and is a table
    @view.stubs(:is_unpublished? => false, :dataset? => true)

    # current_user has rights
    @object.current_user.stubs(:rights => [:some_right])
    refute @object.send(:hide_data_lens_create?), 'hide_data_lens_create expected to be false'

    # current_user has no rights
    @object.current_user.stubs(:rights => [])
    assert @object.send(:hide_data_lens_create?), 'hide_data_lens_create expected to be true'
  end

  def test_hide_cell_feed
    @view.stubs(:module_enabled? => true, :is_published? => true, :is_api? => false, :geoParent => nil)
    refute @object.send(:hide_cell_feed?), 'should not be hidden'
    @view.stubs(:module_enabled? => false, :is_published? => true, :is_api? => false, :geoParent => nil)
    assert @object.send(:hide_cell_feed?), 'should be hidden'
    @view.stubs(:module_enabled? => true, :is_published? => false, :is_api? => false, :geoParent => nil)
    assert @object.send(:hide_cell_feed?), 'should be hidden'
    @view.stubs(:module_enabled? => true, :is_published? => true, :is_api? => true, :geoParent => nil)
    assert @object.send(:hide_cell_feed?), 'should be hidden'
    @view.stubs(:module_enabled? => true, :is_published? => true, :is_api? => false, :geoParent => Model.new)
    assert @object.send(:hide_cell_feed?), 'should be hidden'
  end

  def test_hide_discuss
    @view.stubs(:is_published? => true, :is_api? => false, :geoParent => nil)
    refute @object.send(:hide_discuss?), 'should not be hidden'
    @view.stubs(:is_published? => false, :is_api? => false, :geoParent => nil)
    assert @object.send(:hide_discuss?), 'should be hidden'
    @view.stubs(:is_published? => true, :is_api? => true, :geoParent => nil)
    assert @object.send(:hide_discuss?), 'should be hidden'
    @view.stubs(:is_published? => true, :is_api? => false, :geoParent => Model.new)
    assert @object.send(:hide_discuss?), 'should be hidden'
  end

  def test_hide_about
    @view.stubs(:display_type => 'unused')
    link_display = Displays::Href.new(@view)
    other_display = Displays::DataLens.new(@view)

    @view.stubs(:is_href? => false, :is_blobby? => false, :display => link_display)
    refute @object.send(:hide_about?), 'should not be hidden'
    @view.stubs(:is_href? => false, :is_blobby? => true, :display => other_display)
    refute @object.send(:hide_about?), 'should not be hidden'
    @view.stubs(:is_href? => true, :is_blobby? => false, :display => link_display)
    assert @object.send(:hide_about?), 'should be hidden'
    @view.stubs(:is_href? => true, :is_blobby? => true, :display => other_display)
    assert @object.send(:hide_about?), 'should be hidden'
  end

  def test_hide_more_views_views
    @view.stubs(:is_published? => true, :non_tabular? => false, :is_geo? => false, :geoParent => nil)
    refute @object.send(:hide_more_views_views?), 'should not be hidden'
    @view.stubs(:is_published? => true, :non_tabular? => true, :is_geo? => true, :geoParent => nil)
    refute @object.send(:hide_more_views_views?), 'should not be hidden'
    @view.stubs(:is_published? => false, :non_tabular? => false, :is_geo? => false, :geoParent => nil)
    assert @object.send(:hide_more_views_views?), 'should be hidden'
    @view.stubs(:is_published? => false, :non_tabular? => true, :is_geo? => false, :geoParent => nil)
    assert @object.send(:hide_more_views_views?), 'should be hidden'
    @view.stubs(:is_published? => false, :non_tabular? => false, :is_geo? => true, :geoParent => nil)
    assert @object.send(:hide_more_views_views?), 'should be hidden'
    @view.stubs(:is_published? => false, :non_tabular? => false, :is_geo? => false, :geoParent => Model.new)
    assert @object.send(:hide_more_views_views?), 'should be hidden'
  end

  def test_hide_more_views_snapshots
    @view.stubs(:new_backend? => false, :is_unpublished? => false, :flag? => true, :is_arcgis? => false, :is_geo? => false)
    refute @object.send(:hide_more_views_snapshots?), 'should not be hidden'
    @view.stubs(:new_backend? => true, :is_unpublished? => false, :flag? => true, :is_arcgis? => false, :is_geo? => false)
    assert @object.send(:hide_more_views_snapshots?), 'should be hidden'
    @view.stubs(:new_backend? => false, :is_unpublished? => true, :flag? => true, :is_arcgis? => false, :is_geo? => false)
    assert @object.send(:hide_more_views_snapshots?), 'should be hidden'
    @view.stubs(:new_backend? => false, :is_unpublished? => false, :flag? => false, :is_arcgis? => false, :is_geo? => false)
    assert @object.send(:hide_more_views_snapshots?), 'should be hidden'
    @view.stubs(:new_backend? => false, :is_unpublished? => false, :flag? => true, :is_arcgis? => true, :is_geo? => false)
    assert @object.send(:hide_more_views_snapshots?), 'should be hidden'
    @view.stubs(:new_backend? => false, :is_unpublished? => false, :flag? => true, :is_arcgis? => false, :is_geo? => true)
    assert @object.send(:hide_more_views_snapshots?), 'should be hidden'
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

