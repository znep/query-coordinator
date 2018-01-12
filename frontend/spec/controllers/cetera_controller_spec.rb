require 'rails_helper'

describe CeteraController do
  include TestHelperMethods

  describe 'get /cetera/users' do
    let(:empty_results) { { 'results' => [] } }
    let(:two_results) { json_fixture("cetera_two_user_results.json") }
    let(:all_results) { json_fixture("cetera_four_user_results.json") }

    before(:each) do
      init_anonymous_environment
      allow(CurrentDomain).to receive(:cname).and_return('localhost')
      allow(subject).to receive(:enable_site_chrome?).and_return(false)
    end

    context 'when query is provided' do
      it 'fetches users by query' do
        expect_any_instance_of(Cetera::UserSearch).to receive(:find_all_by_query).
          with('pink dinosaurs', '', nil,  :limit => 25).
          and_return(empty_results)

        get :fuzzy_user_search, :q => 'pink dinosaurs'

        expect(response).to have_http_status(:success)
        expect(response.body).to eq( [].to_json )
      end

      it 'handles errors thrown by Cetera' do
        expect_any_instance_of(Cetera::UserSearch).to receive(:find_all_by_query).
          and_raise('Error')

        get :fuzzy_user_search, :q => 'pink dinosaurs'

        expect(response).to have_http_status(:internal_server_error)
      end
    end

    context 'when limit is provided' do
      it 'limits the results accordingly' do
        expect_any_instance_of(Cetera::UserSearch).to receive(:find_all_by_query).
          with('pink dinosaurs', '', nil, :limit => 2).
          and_return(two_results)

        get :fuzzy_user_search, :q => 'pink dinosaurs', :limit => 2

        expect(response).to have_http_status(:success)
        expect(JSON.parse(response.body).length).to eq(2)
      end
    end

    context 'when limit is not provided' do
      it 'the default limit is used' do
        expect_any_instance_of(Cetera::UserSearch).to receive(:find_all_by_query).
          with('bear', '', nil, :limit => 25).
          and_return(all_results)

        get :fuzzy_user_search, :q => 'bear', :limit => 25

        expect(response).to have_http_status(:success)
        expect(JSON.parse(response.body).length).to eq(4)
      end
    end

    context 'when flags are provided' do
      it 'passes the flags to Cetera\'s find_all_by_query method' do
        expect_any_instance_of(Cetera::UserSearch).to receive(:find_all_by_query).
          with('pink dinosaurs', '', nil,  {:limit => 25, :flags => 'admin'}).
          and_return(two_results)

        get :fuzzy_user_search, :q => 'pink dinosaurs', :flags => 'admin'

        expect(response).to have_http_status(:success)
      end
    end

    context 'when domain is provided' do
      it "passes the domain to Cetera's find_all_by_query method" do
        expect_any_instance_of(Cetera::UserSearch).to receive(:find_all_by_query).
          with('pink dinosaurs', '', nil, :limit => 25, :domain => 'land.of.oz').
          and_return(two_results)

        get :fuzzy_user_search, :q => 'pink dinosaurs', :domain => 'land.of.oz'

        expect(response).to have_http_status(:success)
      end
    end

    it 'handles unknown parameters' do
      get :fuzzy_user_search, :foo => 'green monsters'

      expect(response).to have_http_status(:bad_request)
    end
  end

  describe 'get /cetera/autocomplete' do
    let(:anonymous_search) { :get_titles_of_anonymously_viewable_views }
    let(:nymous_search) { :get_titles_of_views }
    let(:passed_query) { 'pink dinosaurs' }

    before(:each) do
      init_anonymous_environment
      allow(CurrentDomain).to receive(:cname).and_return('localhost')
      allow(subject).to receive(:enable_site_chrome?).and_return(false)

      allow_any_instance_of(Cetera::AutocompleteSearch).
        to receive(anonymous_search).and_return({}.to_json)
      allow_any_instance_of(Cetera::AutocompleteSearch).
        to receive(nymous_search).and_return({}.to_json)
      allow(Federation).to receive(:federated_domain_cnames).and_return(%w(land.of.oz))
    end

    context 'when query is provided' do
      it 'fetches results by query' do
        expect(subject.send(:autocomplete_search_client)).
          to receive(anonymous_search) do |query, _1, _2, _3|
          expect(query).to eq(passed_query)
        end
        get :autocomplete, :q => passed_query

        expect(response).to have_http_status(:success)
      end

      it 'handles errors thrown by Cetera' do
        allow_any_instance_of(Cetera::AutocompleteSearch).
          to receive(anonymous_search).and_raise('Error')

        get :autocomplete, :q => passed_query

        expect(response).to have_http_status(:internal_server_error)
      end
    end

    context 'when limit is provided' do
      let(:limit) { 2 }

      it 'limits the results accordingly' do
        expect(subject.send(:autocomplete_search_client)).
          to receive(anonymous_search) do |query, _1, _2, params|
          expect(query).to eq(passed_query)
          expect(params[:limit]).to eq(limit)
        end
        get :autocomplete, :q => passed_query, :limit => limit

        expect(response).to have_http_status(:success)
      end
    end

    context 'when limit is not provided' do
      it 'the default limit is used' do
        expect(subject.send(:autocomplete_search_client)).
          to receive(anonymous_search) do |query, _1, _2, params|
          expect(query).to eq(passed_query)
          expect(params[:limit]).to eq(30)
        end
        get :autocomplete, :q => passed_query

        expect(response).to have_http_status(:success)
      end
    end

    context 'when flags are provided' do
      let(:flags) { 'admin' }

      it 'passes the flags to Cetera\'s find_all_by_query method' do
        expect(subject.send(:autocomplete_search_client)).
          to receive(anonymous_search) do |query, _1, _2, params|
          expect(query).to eq(passed_query)
          expect(params[:flags]).to eq(flags)
        end
        get :autocomplete, :q => passed_query, :flags => flags

        expect(response).to have_http_status(:success)
      end
    end

    context 'when domain is provided' do
      let(:domain) { 'land.of.oz' }

      it "passes the domain to Cetera's find_all_by_query method" do
        expect(subject.send(:autocomplete_search_client)).
          to receive(anonymous_search) do |query, _1, _2, params|
          expect(query).to eq(passed_query)
          expect(params[:domain]).to eq(domain)
        end
        get :autocomplete, :q => passed_query, :domain => domain

        expect(response).to have_http_status(:success)
      end
    end

    it 'handles unknown parameters' do
      get :autocomplete, :foo => 'green monsters'

      expect(response).to have_http_status(:bad_request)
    end
  end
end
