require 'rails_helper'

describe ApplicationController do
  include TestHelperMethods

  before do
    init_current_domain
    init_current_user(subject)
  end

  describe '#is_superadmin?' do

    describe "when the current user isn't an admin" do
      it 'returns boolean false confirming that user is not an admin' do
        allow(subject.current_user).to receive(:is_superadmin?).and_return(false)
        expect(subject.is_superadmin?).to be(false)
      end
    end

    describe 'when the current user is an admin' do
      it 'returns boolean true confirming that user is an admin' do
        allow(subject.current_user).to receive(:is_superadmin?).and_return(true)
        expect(subject.is_superadmin?).to be(true)
      end
    end

    describe "when the current user doesn't exist" do
      it 'return false confirming that the user is not an admin' do
        allow(subject).to receive(:current_user).and_return(nil)
        expect(subject.is_superadmin?).to be(false)
      end
    end

  end

  describe '#show_nbe_redirection_warning?' do

    describe 'when disable_nbe_redirection_warning_message is true' do
      describe "when the user isn't an admin, and disable_obe_redirection is true" do
        it 'return boolean false confirming that the message should not be shown' do
          allow(subject.current_user).to receive(:is_superadmin?).and_return(false)
          stub_feature_flags_with(
            :disable_nbe_redirection_warning_message => true,
            :disable_obe_redirection => true
          )
          expect(subject.show_nbe_redirection_warning?).to be(false)
        end
      end

      describe 'when the user is an admin and disable_obe_redirection is true' do
        it 'return boolean false confirming that the message should not be shown' do
          allow(subject.current_user).to receive(:is_superadmin?).and_return(true)
          stub_feature_flags_with(
            :disable_nbe_redirection_warning_message => true,
            :disable_obe_redirection => true
          )
          expect(subject.show_nbe_redirection_warning?).to be(false)
        end
      end

      describe 'when the user is an admin and disable_obe_redirection is false' do
        it 'return boolean false confirming that the message should not be shown' do
          allow(subject.current_user).to receive(:is_superadmin?).and_return(true)
          stub_feature_flags_with(
            :disable_nbe_redirection_warning_message => true,
            :disable_obe_redirection => false
          )
          expect(subject.show_nbe_redirection_warning?).to be(false)
        end
      end

      describe "when the user isn't an admin and disable_obe_redirection is false" do
        it 'return boolean true confirming that the message should not be shown' do
          allow(subject.current_user).to receive(:is_superadmin?).and_return(false)
          stub_feature_flags_with(
            :disable_nbe_redirection_warning_message => true,
            :disable_obe_redirection => false
          )
          expect(subject.show_nbe_redirection_warning?).to be(false)
        end
      end

    end

    describe 'when disable_nbe_redirection_warning_message is false' do
      describe "when the user isn't an admin, and disable_obe_redirection is true" do
        it 'return boolean true confirming that the message should be shown' do
          allow(subject.current_user).to receive(:is_superadmin?).and_return(false)
          stub_feature_flags_with(
            :disable_nbe_redirection_warning_message => false,
            :disable_obe_redirection => true
          )
          expect(subject.show_nbe_redirection_warning?).to be(true)
        end
      end

      describe 'when the user is an admin and disable_obe_redirection is true' do
        it 'return boolean true confirming that the message should be shown' do
          allow(subject.current_user).to receive(:is_superadmin?).and_return(true)
          stub_feature_flags_with(
            :disable_nbe_redirection_warning_message => false,
            :disable_obe_redirection => true
          )
          expect(subject.show_nbe_redirection_warning?).to be(true)
        end
      end

      describe 'when the user is an admin and disable_obe_redirection is false' do
        it 'return boolean true confirming that the message should be shown' do
          allow(subject.current_user).to receive(:is_superadmin?).and_return(true)
          stub_feature_flags_with(
            :disable_nbe_redirection_warning_message => false,
            :disable_obe_redirection => false
          )
          expect(subject.show_nbe_redirection_warning?).to be(true)
        end
      end

      describe "when the user isn't an admin and disable_obe_redirection is false" do
        it 'return boolean false confirming that the message should not be shown' do
          allow(subject.current_user).to receive(:is_superadmin?).and_return(false)
          stub_feature_flags_with(
            :disable_nbe_redirection_warning_message => false,
            :disable_obe_redirection => false
          )
          expect(subject.show_nbe_redirection_warning?).to be(false)
        end
      end

    end

  end

end
