require 'rails_helper'

describe View do
  include TestHelperMethods

  before(:each) do
    init_current_domain
  end

  describe 'self.find_derived_view_using_read_from_nbe' do
    let(:view_id) { '1234-5679' }

    it 'returns the parsed response from the core endpoint' do
      stub_request(:get, 'http://localhost:8080/views/1234-5679.json?read_from_nbe=true&version=2.1').
         with(:headers => request_headers).
         to_return(
           :status => 200,
           :headers => {},
           :body => JSON::dump({ :id => view_id })
         )

      result = View.find_derived_view_using_read_from_nbe(view_id)

      expect(result).to be_an_instance_of(View)
      expect(result.id).to eq(view_id)
    end

    it 'raises an error if Core returns an error' do
      stub_request(:get, 'http://localhost:8080/views/1234-5679.json?read_from_nbe=true&version=2.1').
         with(:headers => request_headers).
         to_raise(CoreServer::Error)

      expect { View.find_derived_view_using_read_from_nbe(view_id) }.to raise_error(CoreServer::Error)
    end
  end

  describe 'measure display types' do
    let(:fake_views) do
      [
        {
          'id' => 'fake-fak1',
          'name' => 'Fake 1',
          'view_type' => 'measure',
          'display_type' => 'measure'
        },
        {
          'id' => 'fake-fak2',
          'name' => 'Fake 2',
          'view_type' => 'story'
        }
      ]
    end

    it 'Should return true when given a measure' do
      expect(View.new(fake_views[0]).op_measure?)
    end

    it 'Should return false when given a page that is not a measure' do
      expect(!View.new(fake_views[1]).op_measure?)
    end
  end

  describe '#can_edit_measure?' do
    let(:non_measure_view) do
      View.new({
        "id" => "test-test",
        "name" => "Im a measure",
        "viewType" => "not_measure",
        "displayType" => "not_measure"
      })
    end

    let(:measure_view) do
      View.new({
        "id" => "test-test",
        "name" => "Im a measure",
        "viewType" => "measure",
        "displayType" => "measure",
        "rights" => rights
      })
    end

    it 'raises a RunTimeError when view is not a measure' do
      expect { non_measure_view.can_edit_measure? }.to raise_error(RuntimeError)
    end

    describe 'on a view with mutation rights' do
      let(:rights) { [ViewRights::ADD, ViewRights::DELETE, ViewRights::WRITE, ViewRights::UPDATE_VIEW] }

      it 'returns true' do
        expect(measure_view.can_edit_measure?).to be(true)
      end
    end

    describe 'on a view with read only rights' do
      let(:rights) { [ViewRights::READ] }

      it 'returns false' do
        expect(measure_view.can_edit_measure?).to be(false)
      end
    end

    describe 'on a view with no rights' do
      let(:rights) { [] }

      it 'returns false' do
        expect(measure_view.can_edit_measure?).to be(false)
      end
    end
  end

  describe 'draft display types' do
    let(:fake_views) do
      [
        {
          'id' => 'fake-fak1',
          'name' => 'Fake 1',
          'view_type' => 'tabular',
          'display_type' => 'draft'
        },
        {
          'id' => 'fake-fak2',
          'name' => 'Fake 2',
          'view_type' => 'story'
        },
        {
          'id' => 'fake-fak2',
          'name' => 'Fake 2',
          'view_type' => 'tabular',
          'display_type' => 'table'
        }
      ]
    end

    it 'Should return true when given an asset that is a draft dataset?' do
      expect(View.new(fake_views[0]).draft?)
    end

    it 'Should return false when given a page that is not a draft display type' do
      expect(!View.new(fake_views[1]).draft?)
    end

    it 'Should return false when given a tabular dataset without the draft display type' do
      expect(!View.new(fake_views[2]).draft?)
    end
  end

  describe 'pulse view types' do
    let(:fake_views) do
      [
        {
          'id' => 'fake-fak1',
          'name' => 'Fake 1',
          'displayType' => 'pulse'
        },
        {
          'id' => 'fake-fak2',
          'name' => 'Fake 2',
          'displayType' => 'story'
        }
      ]
    end

    it 'Should return true when given an asset that is a Pulse asset?' do
      expect(View.new(fake_views[0]).pulse?)
    end

    it 'Should return false when given a page that is not a Pulse display type' do
      expect(!View.new(fake_views[1]).pulse?)
    end
  end

  describe '.find_multiple_dedup' do

    let(:fake_views) do
      [
        {
          'id' => 'fake-fak1',
          'name' => 'Fake 1'
        },
        {
          'id' => 'fake-fak2',
          'name' => 'Fake 2'
        },
        {
          'id' => 'fake-fak3',
          'name' => 'Fake 3'
        }
      ]
    end

    it 'returns a hash from ids to values' do
      allow(CurrentDomain).to receive(:cname).and_return('localhost')

      stub_request(:get, 'http://localhost:8080/views.json?ids%5B%5D=fake-fak1&ids%5B%5D=fake-fak2&ids%5B%5D=fake-fak3').
         with(:headers => request_headers).
         to_return(
           :status => 200,
           :headers => {},
           :body => JSON::dump(fake_views)
         )

      expect(View.find_multiple_dedup(%w(fake-fak1 fake-fak2 fake-fak1 fake-fak3 fake-fak2))).to eq({
        'fake-fak1' => View.new(fake_views[0]),
        'fake-fak2' => View.new(fake_views[1]),
        'fake-fak3' => View.new(fake_views[2])
      })
    end

    it 'puts a nil entry in the result if that id is not included in the API response' do
      stub_request(:get, 'http://localhost:8080/views.json?ids%5B%5D=fake-fak1&ids%5B%5D=fake-fak2&ids%5B%5D=fake-fak3&ids%5B%5D=fake-fak5').
         with(:headers => request_headers).
         to_return(
           :status => 200,
           :headers => {},
           :body => JSON::dump(fake_views)
         )

      expect(View.find_multiple_dedup(%w(fake-fak1 fake-fak2 fake-fak1 fake-fak3 fake-fak2 fake-fak5))).to eq({
        'fake-fak1' => View.new(fake_views[0]),
        'fake-fak2' => View.new(fake_views[1]),
        'fake-fak3' => View.new(fake_views[2]),
        'fake-fak5' => nil
      })
    end

  end

  describe '.featured_content' do
    it 'returns the parsed response from the core endpoint' do
      stub_request(:get, 'http://localhost:8080/views/1234-5679/featured_content.json').
         with(:headers => request_headers).
         to_return(
           :status => 200,
           :headers => {},
           :body => JSON::dump([1, 2, 3])
         )

      view_data = { 'id' => '1234-5679' }
      expect(View.new(view_data).featured_content).to eq([1, 2, 3])
    end
  end

  describe '.get_preview_image_url' do
    it 'returns the url for stories' do
      view = View.new({ 'id' => '1234-5678', 'previewImageId' => 'awesome-image-id' })
      expect(view).to receive(:story?).and_return(true)
      expect(Storyteller).to receive(:get_tile_image).and_return('neat-picture')

      expect(view.get_preview_image_url('cookies', 'request_id')).to eq('neat-picture')
    end

    it 'returns the url when previewImageId is present' do
      view_data = { 'id' => '1234-5678', 'previewImageId' => 'awesome-image-id' }
      expected_url = '/api/views/1234-5678/files/awesome-image-id'

      expect(View.new(view_data).get_preview_image_url('cookies', 'request_id')).to eq(expected_url)
    end

    it 'returns nil if the previewImageId is not present' do
      view_data = { 'id' => '1234-5678' }

      expect(View.new(view_data).get_preview_image_url('cookies', 'request_id')).to be_nil
    end
  end

  describe '.is_derived_view?' do
    let(:view) { View.new }

    it 'is false if the view is not tabular' do
      allow(view).to receive(:is_tabular?).and_return(false)
      expect(view.is_derived_view?).to be false
    end

    context 'when the view is tabular' do
      before(:each) do
        allow(view).to receive(:is_tabular?).and_return(true)
        allow(view).to receive(:is_blist?).and_return(false)
        allow(view).to receive(:is_arcgis?).and_return(false)
        allow(view).to receive(:is_api_geospatial?).and_return(false)
      end

      it 'is false if the view is a blist' do
        allow(view).to receive(:is_blist?).and_return(true)
        expect(view.is_derived_view?).to be false
      end

      it 'is false if the view is an ESRI map' do
        allow(view).to receive(:is_arcgis?).and_return(true)
        expect(view.is_derived_view?).to be false
      end

      it 'is false if the view is an API-ingressed Mondara map' do
        allow(view).to receive(:is_api_geospatial?).and_return(true)
        expect(view.is_derived_view?).to be false
      end

      it 'is true if the view is not a blist, an ESRI map, or an API-ingressed Mondara map' do
        expect(view.is_derived_view?).to be true
      end
    end
  end

  describe '.blist_or_derived_view_but_not_data_lens?' do
    let(:view) { View.new }

    before(:each) do
      allow(view).to receive(:is_blist?).and_return(false)
      allow(view).to receive(:is_derived_view?).and_return(false)
      allow(view).to receive(:data_lens?).and_return(false)
    end

    it 'returns true when view.is_blist? is true' do
      allow(view).to receive(:is_blist?).and_return(true)

      expect(view.blist_or_derived_view_but_not_data_lens?).to eq(true)
    end

    it 'returns true when view.is_derived_view? is true' do
      allow(view).to receive(:is_derived_view?).and_return(true)

      expect(view.blist_or_derived_view_but_not_data_lens?).to eq(true)
    end

    it 'returns false when view.data_lens? is true' do
      allow(view).to receive(:is_derived_view?).and_return(true)
      allow(view).to receive(:data_lens?).and_return(true)

      expect(view.blist_or_derived_view_but_not_data_lens?).to eq(false)
    end

    it 'returns false when nothing is true' do
      expect(view.blist_or_derived_view_but_not_data_lens?).to eq(false)
    end
  end

  describe '.visualization_canvas?' do
    let(:visualization_canvas_data) do
      {
        'viewType' => 'tabular',
        'displayType' => 'visualization',
        'displayFormat' => {}
      }
    end

    context 'view is a visualization canvas' do
      it 'returns true when the displayType is visualization' do
        expect(View.new(visualization_canvas_data).visualization_canvas?).to be true
      end

      it 'returns true when displayFormat is not defined' do
        visualization_canvas_data.delete('displayFormat')
        expect(View.new(visualization_canvas_data).visualization_canvas?).to be true
      end
    end

    it 'returns false when view type is not tabular' do
      visualization_canvas_data['viewType'] = 'geospatial'
      expect(View.new(visualization_canvas_data).visualization_canvas?).to be false
    end

    it 'returns false when not a visualization canvas' do
      visualization_canvas_data['displayType'] = 'data_lens'
      expect(View.new(visualization_canvas_data).visualization_canvas?).to be false
    end
  end

  describe '.named_resource_url' do
    before do
      allow(CurrentDomain).to receive(:cname).and_return('localhost')
    end

    it 'does not return a url if there is no resourceName' do
      expect(View.new({}).named_resource_url).to be_nil
    end

    it 'returns a url if there is a resourceName' do
      expect(View.new({ 'resourceName' => 'wombats' }).named_resource_url).
        to eq('https://localhost/resource/wombats.json')
    end
  end

  describe '.new_backend?' do
    let(:view) { View.new }

    it 'reflects the underlying model data' do
      view.data = {'newBackend' => false}
      expect(view.newBackend?).to be(false)

      view.data = {'newBackend' => true}
      expect(view.newBackend?).to be(true)
    end

    it 'reflects the underlying model update data which may override model data' do
      view.data = {'newBackend' => false}
      view.update_data = {'newBackend' => true}
      expect(view.newBackend?).to be(true)

      view.data = {'newBackend' => true}
      view.update_data = {'newBackend' => false}
      expect(view.newBackend?).to be(false)
    end
  end

  describe 'blobs' do
    let (:view) do
      View.new({
        'id' => 'blob-view',
        'viewType' => 'blobby',
        'blobId' => '1a05430e-b1c1-4ff2-911c-3979eb54ed4d',
        'blobFilename' => 'hotfix_giraffes.zip'
      })
    end

    it 'constructs the blob href correctly' do
      expected = '/api/views/blob-view/files/1a05430e-b1c1-4ff2-911c-3979eb54ed4d?filename=hotfix_giraffes.zip'
      expect(view.blobs.first['href']).to eq(expected)
    end
  end

  describe 'can_see_stats?' do
    let (:view) do
      View.new({
        'rights' => rights
      })
    end

    describe 'on a view giving no rights' do
      let (:rights) { [] }

      it 'returns false' do
        expect(view.can_see_stats?).to be(false)
      end
    end

    describe 'on a view giving insufficient rights' do
      let (:rights) { [
        'read', 'write', 'add', 'delete', 'grant', 'add_column', # no remove_column right!
        'update_column', 'update_view', 'delete_view'
      ] }

      it 'returns false' do
        expect(view.can_see_stats?).to be(false)
      end
    end

    describe 'on a view giving grant, add_column, and remove_column rights' do
      let (:rights) { [
        'read', 'write', 'add', 'delete', 'grant', 'add_column', 'remove_column',
        'update_column', 'update_view', 'delete_view'
      ] }

      it 'returns true' do
        expect(view.can_see_stats?).to be(true)
      end
    end
  end

  context 'when calling an api-dependent method like #profile_image_path' do

    let(:view_data) do <<-JSON
      {
        "id" : "2zg4-hn5a",
        "owner" : {
          "id" : "ccu6-bz4q",
          "description" : "Amministrazione Pubblica Locale",
          "displayName" : "Comune di Monza"
        }
      }
    JSON
    end

    subject { View.parse(view_data) }

    context 'owner has profile image' do
      let(:user_data) do <<-JSON
        {
          "id" : "ccu6-bz4q",
          "description" : "Amministrazione Pubblica Locale",
          "displayName" : "Comune di Monza",
          "lastNotificationSeenAt" : 1507200855,
          "oid" : 1055,
          "profileImageUrlLarge" : "/api/users/ccu6-bz4q/profile_images/LARGE",
          "profileImageUrlMedium" : "/api/users/ccu6-bz4q/profile_images/THUMB",
          "profileImageUrlSmall" : "/api/users/ccu6-bz4q/profile_images/TINY",
          "roleName" : "editor",
          "screenName" : "Comune di Monza",
          "rights" : [ "create_datasets", "view_domain", "create_pages", "view_goals", "view_dashboards", "view_story", "view_unpublished_story", "create_data_lens" ]
        }
        JSON
      end

      before(:each) do
        allow(Owner).to receive(:find).and_return(User.parse(user_data))
      end

      it 'should make one request' do
        expect(Owner).to receive(:find).once
        subject.owner.profile_image_path
      end

      it 'should make ONLY one request' do
        expect(Owner).to receive(:find).once
        subject.owner.profile_image_path
        subject.owner.profile_image_path
      end

      it 'should return the profile image' do
        expect(subject.owner.profile_image_path).
          to eq("/api/users/ccu6-bz4q/profile_images/THUMB")
      end
    end

    context 'owner does not have profile image' do
      let(:user_data) do <<-JSON
        {
          "id" : "ccu6-bz4q",
          "description" : "Amministrazione Pubblica Locale",
          "displayName" : "Comune di Monza",
          "lastNotificationSeenAt" : 1507200855,
          "oid" : 1055,
          "roleName" : "editor",
          "screenName" : "Comune di Monza",
          "rights" : [ "create_datasets", "view_domain", "create_pages", "view_goals", "view_dashboards", "view_story", "view_unpublished_story", "create_data_lens" ]
        }
        JSON
      end

      before(:each) do
        allow(Owner).to receive(:find).and_return(User.parse(user_data))
      end

      # This is non-ideal, but we don't know the difference between "has not made a request"
      # and "will find nothing when we make a request".
      it 'should make one request' do
        expect(Owner).to receive(:find).once
        subject.owner.profile_image_path
      end

      it 'should make ONLY one request' do
        expect(Owner).to receive(:find).once
        subject.owner.profile_image_path
        subject.owner.profile_image_path
      end

      it 'should return the profile image' do
        # Default response.
        expect(subject.owner.profile_image_path).to eq("/images/medium-profile.png")
      end
    end
  end
end
