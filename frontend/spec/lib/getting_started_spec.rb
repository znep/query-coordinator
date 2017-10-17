require 'rails_helper'

describe GettingStarted do
  let(:user) { OpenStruct.new }

  describe ".panels_for" do
    i18n_scope = GettingStarted::Panel::I18N_SCOPE

    # Check the panels for each of the rights
    ['manage_users', 'create_datasets', 'view_others_datasets'].each do |right|
      describe "when user has '#{right}'" do
        it "should return correct panels" do
          user.rights = [right]

          actual_titles = GettingStarted.panels_for(user).map(&:title)
          expected_titles = GettingStarted::PANELS_FOR[right].map do |title|
            [i18n_scope, title, "title"].join(".")
          end

          expect(actual_titles).to eq(expected_titles)
        end
      end
    end

    describe "when user has any other right" do
      it "should return default panels" do
        user.rights = ['some_right', 'another_right']

        actual_titles = GettingStarted.panels_for(user).map(&:title)
        expected_titles = GettingStarted::PANELS_FOR['default'].map do |title|
          [i18n_scope, title, "title"].join(".")
        end

        expect(actual_titles).to eq(expected_titles)
      end
    end
  end

  describe ".highest_user_right" do
    describe "when user has 'manage_users'" do
      it "should return 'manage_users'" do
        user.rights = %w( order_should_not_matter view_others_datasets manage_users create_datasets )
        expect(GettingStarted.highest_user_right(user)).to eq('manage_users')
      end
    end

    describe "when user has 'create_datasets'" do
      it "should return 'create_datasets'" do
        user.rights = %w( other_right create_datasets view_others_datasets )
        expect(GettingStarted.highest_user_right(user)).to eq('create_datasets')
      end
    end

    describe "when user has 'view_others_datasets'" do
      it "should return 'view_others_datasets'" do
        user.rights = %w( other_right another_right view_others_datasets )
        expect(GettingStarted.highest_user_right(user)).to eq('view_others_datasets')
      end
    end

    describe "when user has no rights" do
      it "should return 'default'" do
        user.rights = []
        expect(GettingStarted.highest_user_right(user)).to eq('default')
      end
    end

    describe "when no user is provided" do
      it "should return 'default'" do
        expect(GettingStarted.highest_user_right(nil)).to eq('default')
      end
    end
  end
end
