# frozen_string_literal: true
require 'i18n/tasks'

describe 'I18n' do
  let(:i18n) { I18n::Tasks::BaseTask.new }
  let(:missing_keys) { i18n.missing_keys(locales: ['en']) }
  let(:unused_keys) { i18n.unused_keys(locales: ['en']) }

  it 'does not have missing en keys' do
    expect(missing_keys).to be_empty,
      "Missing #{missing_keys.leaves.count} i18n keys: #{missing_keys.key_names}\nRun 'i18n-tasks missing en' to troubleshoot. You may first need to run 'bin/pull_translations'."
  end

  # We might want to test for unused keys at some point, but meh for now.
  # it 'does not have unused keys' do
  #   expect(unused_keys).to be_empty,
  #     "#{unused_keys.leaves.count} unused i18n keys, run `i18n-tasks unused en' to show them"
  # end
end
