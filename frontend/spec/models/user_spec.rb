require 'rails_helper'

describe User do
  context 'when calling an api-dependent method like #profile_image_path' do

    subject { User.parse(user_data) }

    context 'user has profile image' do
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

      it 'should make no requests' do
        expect(User).to receive(:find).never
        subject.profile_image_path
      end

      it 'should return the profile image' do
        expect(subject.profile_image_path).
          to eq("/api/users/ccu6-bz4q/profile_images/THUMB")
      end
    end

    context 'user does not have profile image' do
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
        allow(User).to receive(:find).and_return(User.parse(user_data))
      end

      # This is non-ideal, but we don't know the difference between "has not made a request"
      # and "will find nothing when we make a request".
      it 'should make one request' do
        expect(User).to receive(:find).once
        subject.profile_image_path
      end

      it 'should make ONLY one request' do
        expect(User).to receive(:find).once
        subject.profile_image_path
        subject.profile_image_path
      end

      it 'should return the profile image' do
        # Default response.
        expect(subject.profile_image_path).to eq("/images/medium-profile.png")
      end
    end
  end
end
