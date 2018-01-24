require 'rails_helper'

describe NewUxBootstrapController do
  include TestHelperMethods

  describe '#bootstrap' do
    let(:current_user) { TestHelperMethods::NO_USER }
    let(:dataset_id) { 'pe6p-uu2n' }
    let(:obe_id) { 'obew-anid'}
    let(:derived_view) { false }
    let(:new_backend) { true }
    let(:row_count) { 1000 }
    let(:dataset_mocks) do
      {
        :is_derived_view? => derived_view,
        :new_backend? => new_backend,
        :row_count => row_count
      }
    end
    let(:dataset_view) { double(View, dataset_mocks).as_null_object }
    let(:dataset_metadata) { json_fixture('v1-bootstrap-dataset-metadata.json') }
    let(:dataset_name) { dataset_metadata['name'] }
    let(:dataset_description) { dataset_metadata['description'] }
    let(:view_is_public) { false }
    let(:view_rights) { [] }
    let(:permissions) do
      {
        isPublic: view_is_public,
        rights: view_rights
      }
    end
    let(:mock_curated_region) { instance_double(CuratedRegion, :disabled? => curated_region_disabled) }
    let(:curated_region_disabled) { false }

    before do
      init_environment
      init_current_user(subject)

      allow(View).to receive(:find).with(dataset_id).and_return(dataset_view)
      allow(controller).to receive(:fetch_permissions).with(dataset_id).and_return(permissions)
      allow(controller).to receive(:fetch_dataset_metadata).with(dataset_id, anything()).and_return(dataset_metadata)
      allow(View).to receive(:migrations).with(dataset_id).and_return({:obeId => obe_id})
      allow(CuratedRegion).to receive(:find_by_view_id).with('c8h8-ygvf').and_return(mock_curated_region)
    end

    shared_examples 'phidippides-like dataset metadata' do
      let(:page_metadata) { assigns(:page_metadata) }

      before do
        get :bootstrap, app: 'dataCards', id: dataset_id
      end

      it 'has cards' do
        expect(page_metadata['cards']).to be_an(Array)
        expect(page_metadata['cards']).to_not be_empty
      end

      it 'has table card' do
        card_types = page_metadata['cards'].pluck('cardType')
        expect(card_types).to include('table')
      end

      it 'has datasetId' do
        expect(page_metadata['datasetId']).to eq(dataset_id)
      end

      it 'has description' do
        expect(page_metadata['description']).to eq(dataset_description)
      end

      it 'has isFromDerivedView' do
        expect(page_metadata['isFromDerivedView']).to eq(derived_view)
      end

      it 'has name' do
        expect(page_metadata['name']).to eq(dataset_name)
      end

      it 'has primaryAggregation' do
        expect(page_metadata['primaryAggregation']).to eq(nil)
      end

      it 'has primaryAmountField' do
        expect(page_metadata['primaryAmountField']).to eq(nil)
      end

      it 'has version' do
        expect(page_metadata['version']).to eq(2)
      end
    end

    context 'for anonymous users' do
      it 'redirects to dataset' do
        get :bootstrap, app: 'dataCards', id: dataset_id
        expect(response).to redirect_to("/d/#{dataset_id}")
      end
    end

    context 'for authenticated user' do
      before do
        stub_new_ux_bootstrap_user
      end

      it 'is success' do
        get :bootstrap, app: 'dataCards', id: dataset_id
        expect(response).to have_http_status(:ok)
      end

      context 'when super admin' do
        before do
          stub_superadmin_user
        end

        it 'is success' do
          get :bootstrap, app: 'dataCards', id: dataset_id
          expect(response).to have_http_status(:ok)
        end
      end

      context 'when dataset is old backend dataset' do
        let(:new_backend) { false }

        it 'shows 400 error' do
          get :bootstrap, app: 'dataCards', id: dataset_id
          expect(response).to have_http_status(400)
        end

        it 'renders json' do
          expected = { 'error' => true, 'reason' => 'Dataset must be in the dataspace backend, but it is in the legacy backend.' }
          get :bootstrap, app: 'dataCards', id: dataset_id
          expect(JSON.parse(response.body)).to eq(expected)
        end
      end

      context 'when dataset has groupBys' do
        before do
          allow(dataset_view).to receive(:query).and_return(double('query', :groupBys => 'yes'))
        end

        it 'redirects' do
          get :bootstrap, app: 'dataCards', id: dataset_id
          expect(response).to redirect_to("")
        end

        it 'sets flash message' do
          get :bootstrap, app: 'dataCards', id: dataset_id
          expect(flash[:error]).to_not be_blank
        end
      end

      it 'renders data_cards template' do
        get :bootstrap, app: 'dataCards', id: dataset_id
        expect(response).to render_template('data_lens/data_cards')
      end

      it 'assigns obe id as dataset_id' do
        get :bootstrap, app: 'dataCards', id: dataset_id
        expect(assigns(:dataset_id)).to eq(obe_id)
      end

      # it 'includes search cards by default' do
      #   get :bootstrap, app: 'dataCards', id: dataset_id
      #   card_types = assigns[:page_metadata]['cards'].pluck('cardType')
      #   expect(card_types).to include('search')
      # end

      it_behaves_like 'phidippides-like dataset metadata'

      describe 'cards' do
        let(:cards) { assigns(:page_metadata)['cards'] }

        before do
          get :bootstrap, app: 'dataCards', id: dataset_id
        end

        it 'includes a maximum of 10 cards' do
          expect(cards.length).to be <= 10
        end

        it 'does not create card for things that look like OBE sub-columns' do
          obe_column_cards = cards.detect { |card| card['fieldName'] == 'point_city' }
          expect(obe_column_cards).to be_nil
        end

        it 'does not create a card for any money column' do
          money_column_field_name = dataset_metadata['columns'].detect { |field_name, details| details['physicalDatatype'] == 'money' }.first
          money_cards = cards.detect { |card| card['fieldName'] == money_column_field_name }
          expect(money_cards).to be_nil
        end

        it 'does not create a card for a latitude or longitude column' do
          is_latitude = lambda { |fieldName| fieldName =~ /latitude/i }
          is_longitude = lambda { |fieldName| fieldName =~ /longitude/i }
          lat_cards = cards.pluck('fieldName').detect(&is_latitude)
          expect(lat_cards).to be_nil
          long_cards = cards.pluck('fieldName').detect(&is_longitude)
          expect(long_cards).to be_nil
        end

        context 'when dataset size is > 100,000' do
          let(:row_count) { 100_001 }

          it 'does not create a card for point columns' do
            is_point_column = lambda { |fieldName| fieldName =~ /location/i }
            expect(cards.pluck('fieldName').any?(&is_point_column)).to eq(false)
          end
        end

        it 'does not create cards for columns with known uniform cardinality' do
          is_uniform_column = lambda { |fieldName| fieldName =~ /point_city/i }
          expect(cards.pluck('fieldName').any?(&is_uniform_column)).to eq(false)
        end

        it 'does not create a card for columns with no valid card types' do
          is_invalid_card = lambda { |fieldName| fieldName =~ /wacko_card_type/i }
          expect(cards.pluck('fieldName').any?(&is_invalid_card)).to eq(false)
        end

        context 'with point columns' do
          let(:is_point_column) { lambda { |fieldName| fieldName =~ /location/i } }
          let(:dataset_metadata) do
            json_fixture('v1-bootstrap-dataset-metadata.json').
              tap do |metadata|
                metadata['columns']['location']['cardinality'] = cardinality
                metadata['columns']['location']['physicalDatatype'] = 'point'
              end
          end

          context 'with sufficient cardinality' do
            let(:cardinality) { 1000 }

            it 'does include location column card' do
              expect(cards.pluck(:fieldName).any?(&is_point_column)).to eq(true)
            end

            it 'includes a maximum of 10 cards' do
              expect(cards.length).to be <= 10
            end
          end

          context 'with insufficient cardinality' do
            let(:cardinality) { 1 }

            it 'does not include location column card' do
              expect(cards.pluck(:fieldName).any?(&is_point_column)).to eq(false)
            end

            it 'includes a maximum of 10 cards' do
              expect(cards.length).to be <= 10
            end
          end


        end

        context 'with computed columns' do
          let(:is_choropleth) { lambda { |fieldName| fieldName =~ /(other_)?computed/i } }

          context 'when curated region is disabled' do
            let(:curated_region_disabled) { true }

            it 'does not create choropleth cards' do
              expect(cards.pluck('fieldName').any?(&is_choropleth)).to eq(false)
            end
          end

          context 'when curated region is not disabled' do
            let(:curated_region_disabled) { false }

            it 'creates choropleth cards' do
              expect(cards.pluck('fieldName').any?(&is_choropleth)).to eq(true)
            end
          end

          context 'when curated region has errors' do
            let(:mock_curated_region) { nil }

            it 'does not create choropleth cards' do
              expect(cards.pluck('fieldName').any?(&is_choropleth)).to eq(false)
            end
          end
        end
      end

      context 'when using derived view' do
        let(:dataset_id) { 'dfm9-4t6u' }
        let(:derived_view) { true }
        let(:derived_view_metadata) { json_fixture('dataset_metadata_for_derived_view_data_lens.json') }
        let(:dataset_description) { derived_view_metadata['description'] }
        let(:dataset_name) { derived_view_metadata['name'] }

        before do
          allow(controller).to receive(:fetch_dataset_metadata_for_derived_view).
            with(dataset_id).
            and_return(derived_view_metadata)
        end

        it_behaves_like 'phidippides-like dataset metadata'

        it 'renders data_cards template' do
          get :bootstrap, app: 'dataCards', id: dataset_id
          expect(response).to render_template('data_lens/data_cards')
        end

        it 'assigns derived view dataset id' do
          get :bootstrap, app: 'dataCards', id: dataset_id
          expect(assigns(:dataset_id)).to eq(dataset_id)
        end

        it 'does not include search cards by default' do
          get :bootstrap, app: 'dataCards', id: dataset_id
          card_types = assigns(:page_metadata)['cards'].pluck('cardType')
          expect(card_types).to_not include('search')
        end
      end

      context 'with errors' do
        let(:error) { StandardError.new }

        context 'while initiating ephemeral view' do
          before do
            allow(controller).to receive(:instantiate_ephemeral_view).and_raise(error)
          end

          it 'renders 500' do
            expect {
              get :bootstrap, app: 'dataCards', id: dataset_id
            }.to raise_error(error)
            # expect(response).to have_http_status(500)
          end

          context 'with CoreServer::TimeoutError' do
            let(:error) { CoreServer::TimeoutError.new('foo') }

            it 'renders 504' do
              get :bootstrap, app: 'dataCards', id: dataset_id
              expect(response).to have_http_status(504)
            end

            it 'renders error template' do
              get :bootstrap, app: 'dataCards', id: dataset_id
              expect(response).to render_template('shared/error')
            end

            it 'flashes warning' do
              get :bootstrap, app: 'dataCards', id: dataset_id
              expect(flash[:warning]).to eq('A timeout occurred, but we\'re still generating your Data Lens in the background. Please try again in a few minutes.')
            end
          end
        end

        context 'while fetching dataset metadata' do
          before do
            allow(controller).to receive(:fetch_dataset_metadata).and_raise(error)
          end

          it 'notifies Airbrake' do
            expect(Airbrake).to receive(:notify)
            get :bootstrap, app: 'dataCards', id: dataset_id
          end

          it 'renders not found' do
            get :bootstrap, app: 'dataCards', id: dataset_id
            expect(response).to have_http_status(:not_found)
          end
        end
      end

      context 'when user has administrator role' do
        before do
          stub_administrator_user
        end

        it 'is success' do
          get :bootstrap, app: 'dataCards', id: dataset_id
          expect(response).to have_http_status(:ok)
        end
      end

      context 'when user has publisher role' do
        before do
          stub_publisher_user
        end

        it 'is success' do
          get :bootstrap, app: 'dataCards', id: dataset_id
          expect(response).to have_http_status(:ok)
        end
      end

      context 'when user has viewer role' do
        before do
          stub_viewer_user
        end

        it 'is success' do
          get :bootstrap, app: 'dataCards', id: dataset_id
          expect(response).to have_http_status(:ok)
        end
      end
    end
  end

  def stub_new_ux_bootstrap_user
    user = User.new
    allow(controller).to receive(:current_user).and_return(user)
    user
  end

  # a la spec/controllers/administration_controller/spec.rb
  def stub_superadmin_user
    user = stub_new_ux_bootstrap_user
    allow(user).to receive(:is_superadmin?).and_return(true)
  end

  # a la spec/controllers/administration_controller/spec.rb
  def stub_administrator_user
    user = stub_new_ux_bootstrap_user
    allow(user).to receive(:is_superadmin?).and_return(false)
    allow(user).to receive(:role_name).and_return('administrator')
  end

  # a la spec/controllers/administration_controller/spec.rb
  def stub_publisher_user
    user = stub_new_ux_bootstrap_user
    allow(user).to receive(:is_superadmin?).and_return(false)
    allow(user).to receive(:role_name).and_return('publisher')
  end

  # a la spec/controllers/administration_controller/spec.rb
  def stub_viewer_user
    user = stub_new_ux_bootstrap_user
    allow(user).to receive(:is_superadmin?).and_return(false)
    allow(user).to receive(:role_name).and_return('viewer')
  end
end
