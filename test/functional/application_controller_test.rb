require 'test_helper'

class ApplicationControllerTest < ActionController::TestCase

  setup do
    init_core_session
    init_current_domain
    init_signaller
    @controller ||= test_case.controller_class.new
    init_current_user(@controller)
  end

  context '#is_superadmin?' do

    context "when the current user isn't an admin" do
      should 'return boolean false confirming that user is not an admin' do
        @controller.current_user.stubs(:is_superadmin? => false)
        assert_equal(@controller.is_superadmin?, false)
      end
    end

    context 'when the current user is an admin' do
      should 'return boolean true confirming that user is an admin' do
        @controller.current_user.stubs(:is_superadmin? => true)
        assert_equal(@controller.is_superadmin?, true)
      end
    end

    context "when the current user doesn't exist" do
      should 'return nil confirming that the user is not an admin' do
        @controller.stubs(:current_user => nil)
        assert_equal(@controller.is_superadmin?, false)
      end
    end

  end

  context '#show_nbe_redirection_warning?' do

    context 'when disable_nbe_redirection_warning_message is true' do
      setup do
        stub_feature_flags_with(:disable_nbe_redirection_warning_message => true)
      end

      context "when the user isn't an admin, and disable_obe_redirection is true" do
        should 'return boolean false confirming that the message should not be shown' do
          @controller.current_user.stubs(:is_superadmin? => false)
          stub_feature_flags_with(:disable_obe_redirection => true)
          assert_equal(@controller.show_nbe_redirection_warning?, false)
        end
      end

      context 'when the user is an admin and disable_obe_redirection is true' do
        should 'return boolean false confirming that the message should not be shown' do
          @controller.current_user.stubs(:is_superadmin? => true)
          stub_feature_flags_with(:disable_obe_redirection => true)
          assert_equal(@controller.show_nbe_redirection_warning?, false)
        end
      end

      context 'when the user is an admin and disable_obe_redirection is false' do
        should 'return boolean false confirming that the message should not be shown' do
          @controller.current_user.stubs(:is_superadmin? => true)
          stub_feature_flags_with(:disable_obe_redirection => false)
          assert_equal(@controller.show_nbe_redirection_warning?, false)
        end
      end

      context "when the user isn't an admin and disable_obe_redirection is false" do
        should 'return boolean true confirming that the message should not be shown' do
          @controller.current_user.stubs(:is_superadmin? => false)
          stub_feature_flags_with(:disable_obe_redirection => false)
          assert_equal(@controller.show_nbe_redirection_warning?, false)
        end
      end

    end

    context 'when disable_nbe_redirection_warning_message is false' do

      setup do
        stub_feature_flags_with(:disable_nbe_redirection_warning_message => false)
      end

      context "when the user isn't an admin, and disable_obe_redirection is true" do
        should 'return boolean true confirming that the message should be shown' do
          @controller.current_user.stubs(:is_superadmin? => false)
          stub_feature_flags_with(:disable_obe_redirection => true)
          assert_equal(@controller.show_nbe_redirection_warning?, true)
        end
      end

      context 'when the user is an admin and disable_obe_redirection is true' do
        should 'return boolean true confirming that the message should be shown' do
          @controller.current_user.stubs(:is_superadmin? => true)
          stub_feature_flags_with(:disable_obe_redirection => true)
          assert_equal(@controller.show_nbe_redirection_warning?, true)
        end
      end

      context 'when the user is an admin and disable_obe_redirection is false' do
        should 'return boolean true confirming that the message should be shown' do
          @controller.current_user.stubs(:is_superadmin? => true)
          stub_feature_flags_with(:disable_obe_redirection => false)
          assert_equal(@controller.show_nbe_redirection_warning?, true)
        end
      end

      context "when the user isn't an admin and disable_obe_redirection is false" do
        should 'return boolean false confirming that the message should not be shown' do
          @controller.current_user.stubs(:is_superadmin? => false)
          stub_feature_flags_with(:disable_obe_redirection => false)
          assert_equal(@controller.show_nbe_redirection_warning?, false)
        end
      end

    end

  end

end
