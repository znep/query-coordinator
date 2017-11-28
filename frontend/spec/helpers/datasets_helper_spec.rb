require 'rails_helper'

describe DatasetsHelper do
  include TestHelperMethods

  DEFAULT_VIEW_STATE = {
    :is_alt_view? => false,
    :is_tabular? => true,
    :is_unpublished? => false,
    :is_geo? => false,
    :is_blobby? => false,
    :is_href? => false,
    :is_activity_feed_dataset? => false,
    :flag? => true,
    :has_rights? => true
  }

  let(:request) { ActionController::TestRequest.new(:host => 'localhost') }

  before do
    init_current_domain
    init_signaller
    allow(Configuration).to receive(:find_by_type).and_return([])
    allow(helper).to receive(:request).and_return(nil)
    @controller = ApplicationController.new
    @controller.request = request
    CoreManagedUserSession.controller = @controller
  end

  it 'contains the normal download types' do
    expect(helper.normal_download_types).to eq(
      ['CSV', 'CSV for Excel', 'CSV for Excel (Europe)', 'JSON', 'RDF', 'RSS', 'TSV for Excel', 'XML']
    )
  end

  context 'with a mock view' do

    let(:view) do
      View.new.tap do |the_view|
        DEFAULT_VIEW_STATE.each do |key, value|
          allow(the_view).to receive_messages(DEFAULT_VIEW_STATE)
        end
      end
    end

    before do
      allow(helper).to receive(:view).and_return(view)
    end

    # Need to not verify stubs because view doesn't natively respond to :columns
    context 'row_identifier_select_tag', :verify_stubs => false do
      before do
        allow(view).to receive(:columns).and_return([])
      end

      it 'is not disabled when new_backend? is false' do
        expect(helper.row_identifier_select_tag).to_not match(/disabled/)
      end

      it 'is not disabled when new_backend? is true' do
        allow(view).to receive(:new_backend?).and_return(true)
        expect(helper.row_identifier_select_tag).to_not match(/disabled/)
      end
    end

    context 'show_save_as_button' do
      it 'is true or false when view is in certain states' do
        allow(view).to receive_messages(:is_published? => true, :is_api? => false, :dataset? => true, :new_backend? => false)
        expect(helper.show_save_as_button?).to eq(true)
        allow(view).to receive_messages(:is_published? => true, :is_api? => false, :dataset? => true, :new_backend? => true)
        expect(helper.show_save_as_button?).to eq(true)
        allow(view).to receive_messages(:is_published? => true, :is_api? => false, :dataset? => false)
        expect(helper.show_save_as_button?).to be_falsey
        allow(view).to receive_messages(:is_published? => true, :is_api? => true, :dataset? => true)
        expect(helper.show_save_as_button?).to be_falsey
        allow(view).to receive_messages(:is_published? => true, :is_api? => true, :dataset? => false)
        expect(helper.show_save_as_button?).to be_falsey
        allow(view).to receive_messages(:is_published? => false, :is_api? => false, :dataset? => false)
        expect(helper.show_save_as_button?).to be_falsey
        allow(view).to receive_messages(:is_published? => false, :is_api? => false, :dataset? => true)
        expect(helper.show_save_as_button?).to be_falsey
        allow(view).to receive_messages(:is_published? => false, :is_api? => true, :dataset? => true)
        expect(helper.show_save_as_button?).to be_falsey
        allow(view).to receive_messages(:is_published? => false, :is_api? => true, :dataset? => false)
        expect(helper.show_save_as_button?).to be_falsey
      end

      it 'is true for published, non-api, new backend, non-datasets' do
        allow(FeatureFlags).to receive(:derive).and_return(Hashie::Mash.new(:reenable_ui_for_nbe => true))
        allow(view).to receive_messages(:is_published? => true, :is_api? => false, :dataset? => false, :new_backend? => true)
        expect(helper.show_save_as_button?).to eq(true)
      end
    end

    context 'hide_redirect' do
      it 'returns true of false when the view is in certain states' do
        allow(helper).to receive_messages(:force_editable? => true)
        expect(helper.hide_redirect?).to be_falsey
        allow(helper).to receive_messages(:force_editable? => false, :current_user => User.new)
        allow(view).to receive_messages(:is_published? => true, :is_blist? => true, :can_edit? => true, :is_immutable? => false)
        expect(helper.hide_redirect?).to be_falsey
        allow(view).to receive_messages(:is_published? => false, :is_blist? => true, :can_edit? => true, :is_immutable? => false)
        expect(helper.hide_redirect?).to eq(true)
        allow(view).to receive_messages(:is_published? => true, :is_blist? => false, :can_edit? => true, :is_immutable? => false)
        expect(helper.hide_redirect?).to eq(true)
        allow(view).to receive_messages(:is_published? => true, :is_blist? => true, :can_edit? => false, :is_immutable? => false)
        expect(helper.hide_redirect?).to eq(true)
        allow(view).to receive_messages(:is_published? => true, :is_blist? => true, :can_edit? => true, :is_immutable? => true)
        expect(helper.hide_redirect?).to eq(true)
        allow(helper).to receive_messages(:current_user => nil)
        allow(view).to receive_messages(:is_published? => true, :is_blist? => true, :can_edit? => true, :is_immutable? => false)
        expect(helper.hide_redirect?).to eq(true)
        allow(view).to receive_messages(:is_activity_feed_dataset? => true)
        expect(helper.hide_redirect?).to eq(true)
      end

      it 'allow edit/create working copy on derived views' do
        allow(CurrentDomain).to receive(:configuration).and_return(
            OpenStruct.new(:properties => OpenStruct.new(:derived_view_publication => true))
        )
        allow(helper).to receive_messages(:force_editable? => false, :current_user => User.new)
        allow(view).to receive_messages(:is_published? => true, :is_blist? => false, :is_tabular? => true, :can_edit? => true, :is_immutable? => false)
        expect(helper.hide_redirect?).to eq(false)
      end

      it 'disallow edit/create working copy on non-tabular views' do
        allow(CurrentDomain).to receive(:configuration).and_return(
            OpenStruct.new(:properties => OpenStruct.new(:derived_view_publication => true))
        )
        allow(helper).to receive_messages(:force_editable? => false, :current_user => User.new)
        allow(view).to receive_messages(:is_published? => true, :is_blist? => false, :is_tabular? => false, :can_edit? => true, :is_immutable? => false)
        expect(helper.hide_redirect?).to eq(true)
      end
    end

    context 'hide_add_column' do
      it 'returns true or false when the view is in certain states', :verify_stubs => false do
        allow(view).to receive_messages(:is_unpublished? => true, :is_blist? => true, :has_rights? => true, :is_immutable? => false, :geoParent => nil)
        expect(helper.hide_add_column?).to be_falsey
        allow(view).to receive_messages(:is_unpublished? => false, :is_blist? => true, :has_rights? => true, :is_immutable? => false, :geoParent => nil)
        expect(helper.hide_add_column?).to eq(true)
        allow(view).to receive_messages(:is_unpublished? => true, :is_blist? => false, :has_rights? => true, :is_immutable? => false, :geoParent => nil)
        expect(helper.hide_add_column?).to eq(true)
        allow(view).to receive_messages(:is_unpublished? => true, :is_blist? => true, :has_rights? => false, :is_immutable? => false, :geoParent => nil)
        expect(helper.hide_add_column?).to eq(true)
        allow(view).to receive_messages(:is_unpublished? => true, :is_blist? => true, :has_rights? => true, :is_immutable? => true, :geoParent => nil)
        expect(helper.hide_add_column?).to eq(true)
        allow(view).to receive_messages(:is_unpublished? => true, :is_blist? => true, :has_rights? => true, :is_immutable? => false, :geoParent => Model.new)
        expect(helper.hide_add_column?).to eq(true)
        allow(view).to receive_messages(:is_activity_feed_dataset? => true)
        expect(helper.hide_add_column?).to eq(true)
      end
    end

    context 'hide_append_replace' do
      it 'returns true or false when the view is in certain states' do
        allow(view).to receive_messages(:is_blobby? => true, :new_backend? => false)
        expect(helper.hide_append_replace?).to be_falsey
        allow(view).to receive_messages(:is_geo? => true, :new_backend? => false)
        expect(helper.hide_append_replace?).to be_falsey
        allow(view).to receive_messages(:is_geo? => true, :new_backend? => true)
        expect(helper.hide_append_replace?).to be_falsey
        allow(view).to receive_messages(:is_unpublished? => true, :new_backend? => true )
        expect(helper.hide_append_replace?).to be_falsey
        allow(view).to receive_messages(:is_unpublished? => true, :new_backend? => false )
        allow(FeatureFlags).to receive(:derive).and_return(Hashie::Mash.new(:ingress_strategy => 'nbe'))
        expect(helper.hide_append_replace?).to be_falsey
        allow(view).to receive_messages(:is_activity_feed_dataset? => true)
        expect(helper.hide_append_replace?).to eq(true)
      end
    end

    context 'hide_export_section_for_print' do
      it 'returns true or false when the view is in certain states' do
        allow(view).to receive_messages(:can_print? => true, :new_backend? => false)
        expect(helper.hide_export_section?(:print)).to be_falsey
        allow(view).to receive_messages(:can_print? => false, :new_backend? => false)
        expect(helper.hide_export_section?(:print)).to eq(true)
        allow(view).to receive_messages(:can_print? => true, :new_backend? => true)
        expect(helper.hide_export_section?(:print)).to eq(true)
        allow(view).to receive_messages(:can_print? => false, :new_backend? => true)
        expect(helper.hide_export_section?(:print)).to eq(true)
      end
    end

    context 'hide_export_section_for_download' do
      it 'returns true or false when the view is in certain states' do
        allow(view).to receive_messages(:is_tabular? => true, :is_geo? => false, :is_form? => false)
        expect(helper.hide_export_section?(:download)).to be_falsey
        allow(view).to receive_messages(:is_tabular? => false, :is_geo? => true, :is_form? => false)
        expect(helper.hide_export_section?(:download)).to be_falsey
        allow(view).to receive_messages(:is_tabular? => false, :is_geo? => false, :is_form? => false)
        expect(helper.hide_export_section?(:download)).to eq(true)
        allow(view).to receive_messages(:is_tabular? => true, :is_geo? => false, :is_form? => true)
        expect(helper.hide_export_section?(:download)).to eq(true)
      end
    end

    context 'hide_export_section_for_api' do
      it 'returns true or false when the view is in certain states' do
        allow(view).to receive_messages(:is_tabular? => true)
        expect(helper.hide_export_section?(:api)).to be_falsey
        allow(view).to receive_messages(:is_tabular? => false)
        expect(helper.hide_export_section?(:api)).to eq(true)
      end
    end

    context 'hide_export_section_for_odata' do
      it 'returns true or false when the view is in certain states' do
        allow(view).to receive_messages(:is_alt_view? => false, :is_tabular? => true, :new_backend? => false)
        expect(helper.hide_export_section?(:odata)).to be_falsey
        allow(view).to receive_messages(:is_alt_view? => true, :is_tabular? => true, :new_backend? => false)
        expect(helper.hide_export_section?(:odata)).to eq(true)
        allow(view).to receive_messages(:is_alt_view? => false, :is_tabular? => false, :new_backend? => false)
        expect(helper.hide_export_section?(:odata)).to eq(true)
        allow(view).to receive_messages(:is_alt_view? => false, :is_tabular? => true, :new_backend? => true)
        expect(helper.hide_export_section?(:odata)).to be_falsey
      end
    end

    context 'hide_export_section_for_subscribe' do
      it 'returns true or false when the view is in certain states' do
        allow(view).to receive_messages(:is_published? => true, :is_tabular? => true, :is_api? => false, :is_form? => false)
        expect(helper.hide_export_section?(:subscribe)).to be_falsey
        allow(view).to receive_messages(:is_published? => false, :is_tabular? => true, :is_api? => false, :is_form? => false)
        expect(helper.hide_export_section?(:subscribe)).to eq(true)
        allow(view).to receive_messages(:is_published? => true, :is_tabular? => false, :is_api? => false, :is_form? => false)
        expect(helper.hide_export_section?(:subscribe)).to eq(true)
        allow(view).to receive_messages(:is_published? => true, :is_tabular? => true, :is_api? => true, :is_form? => false)
        expect(helper.hide_export_section?(:subscribe)).to eq(true)
        allow(view).to receive_messages(:is_published? => true, :is_tabular? => true, :is_api? => false, :is_form? => true)
        expect(helper.hide_export_section?(:subscribe)).to eq(true)
      end
    end

    context 'hide_embed_sdp' do
      it 'returns true or false when the view is in certain states' do
        allow(view).to receive_messages(:is_published? => true, :is_api? => false, :new_backend? => false)
        expect(helper.hide_embed_sdp?).to be_falsey
        allow(view).to receive_messages(:is_published? => false, :is_api? => false, :new_backend? => false)
        expect(helper.hide_embed_sdp?).to eq(true)
        allow(view).to receive_messages(:is_published? => true, :is_api? => true, :new_backend? => false)
        expect(helper.hide_embed_sdp?).to eq(true)
        allow(view).to receive_messages(:is_published? => true, :is_api? => false, :new_backend? => true)
        expect(helper.hide_embed_sdp?).to eq(true)
        allow(FeatureFlags).to receive(:derive).and_return(Hashie::Mash.new(:enable_embed_widget_for_nbe => true))
        allow(view).to receive_messages(:is_published? => true, :is_api? => false, :new_backend? => true)
        expect(helper.hide_embed_sdp?).to be_falsey
      end
    end

    context 'hide_conditional_formatting' do
      it 'returns true or false when the view is in certain states', :verify_stubs => false do
        allow(view).to receive_messages(:is_unpublished? => false, :non_tabular? => false, :is_form? => false, :is_api? => false, :geoParent => nil)
        expect(helper.hide_conditional_formatting?).to be_falsey
        allow(view).to receive_messages(:is_unpublished? => true, :non_tabular? => false, :is_form? => false, :is_api? => false, :geoParent => nil)
        expect(helper.hide_conditional_formatting?).to eq(true)
        allow(view).to receive_messages(:is_unpublished? => false, :non_tabular? => true, :is_form? => false, :is_api? => false, :geoParent => nil)
        expect(helper.hide_conditional_formatting?).to eq(true)
        allow(view).to receive_messages(:is_unpublished? => false, :non_tabular? => false, :is_form? => true, :is_api? => false, :geoParent => nil)
        expect(helper.hide_conditional_formatting?).to eq(true)
        allow(view).to receive_messages(:is_unpublished? => false, :non_tabular? => false, :is_form? => false, :is_api? => true, :geoParent => nil)
        expect(helper.hide_conditional_formatting?).to eq(true)
        allow(view).to receive_messages(:is_unpublished? => false, :non_tabular? => false, :is_form? => false, :is_api? => false, :geoParent => Model.new)
        expect(helper.hide_conditional_formatting?).to eq(true)
      end
    end

    context 'hide_form_create' do
      it 'returns true or false when the view is in certain states', :verify_stubs => false do
        allow(CurrentDomain).to receive_messages(:user_can? => false)
        allow(helper).to receive(:current_user).and_return(User.new)

        # current user does own
        allow(view).to receive_messages(:owned_by? => true, :parent_dataset => nil)

        allow(view).to receive_messages(:is_published? => true, :non_tabular? => false, :is_form? => true, :is_api? => false, :geoParent => nil, :is_grouped? => false)
        expect(helper.hide_form_create?).to be_falsey
        allow(view).to receive_messages(:is_published? => false, :non_tabular? => false, :is_form? => true, :is_api? => false, :geoParent => nil, :is_grouped? => false)
        expect(helper.hide_form_create?).to eq(true)
        allow(view).to receive_messages(:is_published? => true, :non_tabular? => true, :is_form? => false, :is_api? => false, :geoParent => nil, :is_grouped? => false)
        expect(helper.hide_form_create?).to eq(true)
        allow(view).to receive_messages(:is_published? => true, :non_tabular? => false, :is_form? => true, :is_api? => true, :geoParent => nil, :is_grouped? => false)
        expect(helper.hide_form_create?).to eq(true)
        allow(view).to receive_messages(:is_published? => true, :non_tabular? => false, :is_form? => true, :is_api? => false, :geoParent => Model.new, :is_grouped? => false)
        expect(helper.hide_form_create?).to eq(true)
        allow(view).to receive_messages(:is_published? => true, :non_tabular? => false, :is_form? => true, :is_api? => false, :geoParent => nil, :is_grouped? => true)
        expect(helper.hide_form_create?).to eq(true)

        # current user does not own
        allow(view).to receive_messages(:owned_by? => false)

        allow(view).to receive_messages(:is_published => true, :non_tabular? => false, :is_form? => true, :is_api? => false, :geoParent => nil, :is_grouped => false)
        expect(helper.hide_form_create?).to eq(true)
      end
    end

    context 'hide_update_column' do
      it 'returns true or false when the view is in certain states' do
        allow(view).to receive_messages(:is_snapshotted? => false, :non_tabular? => false, :is_form? => false, :new_backend? => true, :is_api? => false)
        expect(helper.hide_update_column?).to be_falsey
        allow(view).to receive_messages(:is_snapshotted? => false, :non_tabular? => false, :is_form? => false, :new_backend? => false, :is_api? => false)
        expect(helper.hide_update_column?).to be_falsey
        allow(view).to receive_messages(:is_snapshotted? => false, :non_tabular? => false, :is_form? => false, :new_backend? => true, :is_api? => true)
        expect(helper.hide_update_column?).to eq(true)
        allow(view).to receive_messages(:is_snapshotted? => false, :non_tabular? => false, :is_form? => true, :new_backend? => true, :is_api? => false)
        expect(helper.hide_update_column?).to eq(true)
        allow(view).to receive_messages(:is_snapshotted? => false, :non_tabular? => true, :is_form? => false, :new_backend? => true, :is_api? => false)
        expect(helper.hide_update_column?).to eq(true)
        allow(view).to receive_messages(:is_snapshotted? => true, :non_tabular? => false, :is_form? => false, :new_backend? => true, :is_api? => false)
        expect(helper.hide_update_column?).to eq(true)
        allow(view).to receive_messages(:is_activity_feed_dataset? => true)
        expect(helper.hide_update_column?).to eq(true)
      end
    end

    context 'hide_show_hide_columns' do
      it 'returns true or false when the view is in certain states' do
        allow(view).to receive_messages(:is_snapshotted? => false, :non_tabular? => false, :is_form? => false, :new_backend? => true, :is_geo? => false)
        expect(helper.hide_show_hide_columns?).to be_falsey
        allow(view).to receive_messages(:is_snapshotted? => false, :non_tabular? => false, :is_form? => false, :new_backend? => false, :is_geo? => false)
        expect(helper.hide_show_hide_columns?).to be_falsey
        allow(view).to receive_messages(:is_snapshotted? => false, :non_tabular? => false, :is_form? => false, :new_backend? => true, :is_geo? => true)
        expect(helper.hide_show_hide_columns?).to eq(true)
        allow(view).to receive_messages(:is_snapshotted? => false, :non_tabular? => false, :is_form? => true, :new_backend? => true, :is_geo? => false)
        expect(helper.hide_show_hide_columns?).to eq(true)
        allow(view).to receive_messages(:is_snapshotted? => false, :non_tabular? => true, :is_form? => false, :new_backend? => true, :is_geo? => false)
        expect(helper.hide_show_hide_columns?).to eq(true)
        allow(view).to receive_messages(:is_snapshotted? => true, :non_tabular? => false, :is_form? => false, :new_backend? => true, :is_geo? => false)
        expect(helper.hide_show_hide_columns?).to eq(true)
        allow(view).to receive_messages(:is_activity_feed_dataset? => true)
        expect(helper.hide_show_hide_columns?).to eq(true)
      end
    end

    context 'hide_sharing' do
      it 'returns true or false when the view is in certain states', :verify_stubs => false do
        allow(view).to receive_messages(:is_snapshotted? => false, :has_rights? => true, :geoParent => nil)
        expect(helper.hide_sharing?).to be_falsey
        allow(view).to receive_messages(:is_snapshotted? => true, :has_rights? => true, :geoParent => nil)
        expect(helper.hide_sharing?).to eq(true)
        allow(view).to receive_messages(:is_snapshotted? => false, :has_rights? => false, :geoParent => nil)
        expect(helper.hide_sharing?).to eq(true)
        allow(view).to receive_messages(:is_snapshotted? => false, :has_rights? => true, :geoParent => Model.new)
        expect(helper.hide_sharing?).to eq(true)
        allow(view).to receive_messages(:is_activity_feed_dataset? => true)
        expect(helper.hide_sharing?).to eq(true)
      end
    end

    context 'hide_permissions' do
      it 'returns true or false when the view is in certain states', :verify_stubs => false do
        allow(view).to receive_messages(:is_snapshotted? => false, :has_rights? => true, :geoParent => nil)
        expect(helper.hide_permissions?).to be_falsey
        allow(view).to receive_messages(:is_snapshotted? => true, :has_rights? => true, :geoParent => nil)
        expect(helper.hide_permissions?).to eq(true)
        allow(view).to receive_messages(:is_snapshotted? => false, :has_rights? => false, :geoParent => nil)
        expect(helper.hide_permissions?).to eq(true)
        allow(view).to receive_messages(:is_snapshotted? => false, :has_rights? => true, :geoParent => Model.new)
        expect(helper.hide_permissions?).to eq(true)
        allow(view).to receive_messages(:is_activity_feed_dataset? => true)
        expect(helper.hide_permissions?).to eq(true)
      end
    end

    context 'hide_plagiarize' do
      it 'returns true or false when the view is in certain states', :verify_stubs => false do
        allow(helper).to receive_messages(:current_user => User.new)
        allow(CurrentDomain).to receive_messages(:user_can? => true)
        allow(view).to receive_messages(:geoParent => nil)
        expect(helper.hide_plagiarize?).to be_falsey
        allow(CurrentDomain).to receive_messages(:user_can? => false)
        allow(view).to receive_messages(:geoParent => nil)
        expect(helper.hide_plagiarize?).to eq(true)
        allow(CurrentDomain).to receive_messages(:user_can? => true)
        allow(view).to receive_messages(:geoParent => Model.new)
        expect(helper.hide_plagiarize?).to eq(true)
        allow(view).to receive_messages(:is_activity_feed_dataset? => true)
        expect(helper.hide_plagiarize?).to eq(true)
      end
    end

    context 'hide_delete_dataset' do
      it 'returns true or false when the view is in certain states', :verify_stubs => false do
        allow(view).to receive_messages(:has_rights? => true, :geoParent => nil)
        expect(helper.hide_delete_dataset?).to be_falsey
        allow(view).to receive_messages(:has_rights? => false, :geoParent => nil)
        expect(helper.hide_delete_dataset?).to eq(true)
        allow(view).to receive_messages(:has_rights? => false, :geoParent => Model.new)
        expect(helper.hide_delete_dataset?).to eq(true)
        allow(view).to receive_messages(:is_activity_feed_dataset? => true)
        expect(helper.hide_delete_dataset?).to eq(true)
      end
    end

    context 'hide_filter_dataset' do
      it 'returns true or false when the view is in certain states' do
        allow(view).to receive_messages(:non_tabular? => false, :is_form? => false, :new_backend? => true, :is_blist? => true)
        expect(helper.hide_filter_dataset?).to be_falsey
        allow(view).to receive_messages(:non_tabular? => true, :is_form? => false, :new_backend? => true, :is_blist? => true)
        expect(helper.hide_filter_dataset?).to eq(true)
        allow(view).to receive_messages(:non_tabular? => false, :is_form? => true, :new_backend? => true, :is_blist? => true)
        expect(helper.hide_filter_dataset?).to eq(true)
      end
    end

    context 'hide_calendar_create' do
      it 'returns true or false when the view is in certain states', :verify_stubs => false do
        allow(view).to receive_messages(:is_unpublished? => false, :is_alt_view? => true, :available_display_types => ['calendar'], :geoParent => nil)
        expect(helper.hide_calendar_create?).to be_falsey
        allow(view).to receive_messages(:is_unpublished? => false, :is_alt_view? => false, :available_display_types => [], :geoParent => nil)
        expect(helper.hide_calendar_create?).to be_falsey
        allow(view).to receive_messages(:is_unpublished? => true, :is_alt_view? => false, :available_display_types => [], :geoParent => nil)
        expect(helper.hide_calendar_create?).to eq(true)
        allow(view).to receive_messages(:is_unpublished? => false, :is_alt_view? => true, :available_display_types => [], :geoParent => nil)
        expect(helper.hide_calendar_create?).to eq(true)
        allow(view).to receive_messages(:is_unpublished? => false, :is_alt_view? => false, :available_display_types => [], :geoParent => Model.new)
        expect(helper.hide_calendar_create?).to eq(true)
      end
    end

    context 'hide_chart_create' do
      it 'returns true or false when the view is in certain states', :verify_stubs => false do
        allow(view).to receive_messages(:is_unpublished? => false, :is_alt_view? => true, :available_display_types => ['chart'], :geoParent => nil)
        expect(helper.hide_chart_create?).to be_falsey
        allow(view).to receive_messages(:is_unpublished? => false, :is_alt_view? => false, :available_display_types => [], :geoParent => nil)
        expect(helper.hide_chart_create?).to be_falsey
        allow(view).to receive_messages(:is_unpublished? => true, :is_alt_view? => false, :available_display_types => [], :geoParent => nil)
        expect(helper.hide_chart_create?).to eq(true)
        allow(view).to receive_messages(:is_unpublished? => false, :is_alt_view? => true, :available_display_types => [], :geoParent => nil)
        expect(helper.hide_chart_create?).to eq(true)
        allow(view).to receive_messages(:is_unpublished? => false, :is_alt_view? => false, :available_display_types => [], :geoParent => Model.new)
        expect(helper.hide_chart_create?).to eq(true)
      end
    end

    context 'hide_map_create' do
      it 'returns true or false when the view is in certain states', :verify_stubs => false do
        allow(view).to receive_messages(:is_unpublished? => false, :is_alt_view? => true, :available_display_types => ['map'], :geoParent => nil)
        expect(helper.hide_map_create?).to be_falsey
        allow(view).to receive_messages(:is_unpublished? => false, :is_alt_view? => false, :available_display_types => [], :geoParent => nil)
        expect(helper.hide_map_create?).to be_falsey
        allow(view).to receive_messages(:is_unpublished? => true, :is_alt_view? => false, :available_display_types => [], :geoParent => nil)
        expect(helper.hide_map_create?).to eq(true)
        allow(view).to receive_messages(:is_unpublished? => false, :is_alt_view? => true, :available_display_types => [], :geoParent => nil)
        expect(helper.hide_map_create?).to eq(true)
        allow(view).to receive_messages(:is_unpublished? => false, :is_alt_view? => false, :available_display_types => [], :geoParent => Model.new)
        expect(helper.hide_map_create?).to eq(true)
      end
    end

    context 'hide_data_lens_create' do
      it 'returns true or false when the view is in certain states', :verify_stubs => false do
        # no current user
        allow(helper).to receive_messages(:current_user => nil)
        expect(helper.hide_data_lens_create?).to eq(true)

        # existing current_user
        allow(helper).to receive_messages(:current_user => User.new)
        allow(helper.current_user).to receive_messages(:rights => nil)

        # dataset is unpublished
        allow(view).to receive_messages(:is_unpublished? => true, :dataset? => true)
        expect(helper.hide_data_lens_create?).to eq(true)

        # dataset is not table
        allow(view).to receive_messages(:is_unpublished? => false, :dataset? => false)
        expect(helper.hide_data_lens_create?).to eq(true)

        # dataset is published and is a table
        allow(view).to receive_messages(:is_unpublished? => false, :dataset? => true)

        # current_user has rights
        allow(helper.current_user).to receive_messages(:rights => [:some_right])
        expect(helper.hide_data_lens_create?).to be_falsey

        # current_user has no rights
        allow(helper.current_user).to receive_messages(:rights => [])
        expect(helper.hide_data_lens_create?).to eq(true)
      end
    end

    context 'hide_discuss' do
      it 'returns true or false when the view is in certain states', :verify_stubs => false do
        allow(view).to receive_messages(:is_published? => true, :is_api? => false, :geoParent => nil)
        expect(helper.hide_discuss?).to be_falsey
        allow(view).to receive_messages(:is_published? => false, :is_api? => false, :geoParent => nil)
        expect(helper.hide_discuss?).to eq(true)
        allow(view).to receive_messages(:is_published? => true, :is_api? => true, :geoParent => nil)
        expect(helper.hide_discuss?).to eq(true)
        allow(view).to receive_messages(:is_published? => true, :is_api? => false, :geoParent => Model.new)
        expect(helper.hide_discuss?).to eq(true)
      end
    end

    context 'hide_about' do
      it 'returns true or false when the view is in certain states', :verify_stubs => false do
        allow(view).to receive_messages(:display_type => 'unused')
        link_display = Displays::Href.new(view)
        other_display = Displays::DataLens.new(view)

        allow(view).to receive_messages(:is_href? => false, :is_blobby? => false, :display => link_display)
        expect(helper.hide_about?).to be_falsey
        allow(view).to receive_messages(:is_href? => false, :is_blobby? => true, :display => other_display)
        expect(helper.hide_about?).to be_falsey
        allow(view).to receive_messages(:is_href? => true, :is_blobby? => false, :display => link_display)
        expect(helper.hide_about?).to eq(true)
        allow(view).to receive_messages(:is_href? => true, :is_blobby? => true, :display => other_display)
        expect(helper.hide_about?).to eq(true)
      end
    end

    context 'hide_more_views_views' do
      it 'returns true or false when the view is in certain states', :verify_stubs => false do
        allow(view).to receive_messages(:is_published? => true, :non_tabular? => false, :is_geo? => false, :geoParent => nil)
        expect(helper.hide_more_views_views?).to be_falsey
        allow(view).to receive_messages(:is_published? => true, :non_tabular? => true, :is_geo? => true, :geoParent => nil)
        expect(helper.hide_more_views_views?).to be_falsey
        allow(view).to receive_messages(:is_published? => false, :non_tabular? => false, :is_geo? => false, :geoParent => nil)
        expect(helper.hide_more_views_views?).to eq(true)
        allow(view).to receive_messages(:is_published? => false, :non_tabular? => true, :is_geo? => false, :geoParent => nil)
        expect(helper.hide_more_views_views?).to eq(true)
        allow(view).to receive_messages(:is_published? => false, :non_tabular? => false, :is_geo? => true, :geoParent => nil)
        expect(helper.hide_more_views_views?).to eq(true)
        allow(view).to receive_messages(:is_published? => false, :non_tabular? => false, :is_geo? => false, :geoParent => Model.new)
        expect(helper.hide_more_views_views?).to eq(true)
      end
    end

    context 'hide_more_views_snapshots' do
      it 'returns true or false when the view is in certain states' do
        allow(view).to receive_messages(:new_backend? => false, :is_unpublished? => false, :flag? => true, :is_arcgis? => false, :is_geo? => false)
        expect(helper.hide_more_views_snapshots?).to be_falsey
        allow(view).to receive_messages(:new_backend? => true, :is_unpublished? => false, :flag? => true, :is_arcgis? => false, :is_geo? => false)
        expect(helper.hide_more_views_snapshots?).to eq(true)
        allow(view).to receive_messages(:new_backend? => false, :is_unpublished? => true, :flag? => true, :is_arcgis? => false, :is_geo? => false)
        expect(helper.hide_more_views_snapshots?).to eq(true)
        allow(view).to receive_messages(:new_backend? => false, :is_unpublished? => false, :flag? => false, :is_arcgis? => false, :is_geo? => false)
        expect(helper.hide_more_views_snapshots?).to eq(true)
        allow(view).to receive_messages(:new_backend? => false, :is_unpublished? => false, :flag? => true, :is_arcgis? => true, :is_geo? => false)
        expect(helper.hide_more_views_snapshots?).to eq(true)
        allow(view).to receive_messages(:new_backend? => false, :is_unpublished? => false, :flag? => true, :is_arcgis? => false, :is_geo? => true)
        expect(helper.hide_more_views_snapshots?).to eq(true)
      end
    end

  end

end
