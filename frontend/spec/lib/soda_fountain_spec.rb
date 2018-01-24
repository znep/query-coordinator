require 'rails_helper'

describe SodaFountain do
  include TestHelperMethods

  let(:subject) { SodaFountain.new }
  let(:connection_details) do
    {
      'address' => 'localhost',
      'port' => '11111111'
    }.with_indifferent_access
  end
  let(:default_options) do
    {
      dataset_id: 'test-test',
      identifier: 'ident',
      soql: 'i am soql',
      cookies: 'me like cookies',
      request_id: 42
    }
  end

  before do
    init_current_domain
  end

  # Not tested under old Minitest code, and needs to be replaced.
  xdescribe '#issue_request' do

  end

  describe '#create_or_update_rollup_table' do
    it 'issues a PUT using #issue_request' do
      payload = {verb: :put}
      payload.merge!(default_options)
      payload[:data] = payload.delete(:soql)

      expect(subject).to receive(:issue_request).with(payload)
      subject.create_or_update_rollup_table(default_options)
    end
  end

  describe '#delete_rollup_table' do
    it 'issues a DELETE using #issue_request' do
      payload = {verb: :delete}
      payload.merge!(default_options)
      payload.delete(:soql)

      expect(subject).to receive(:issue_request).with(payload)
      subject.delete_rollup_table(default_options)
    end
  end

  describe '#get_extent' do
    it 'issues a GET using #issue_request' do
      payload = {verb: :get}
      payload.merge!(default_options)
      payload[:query] = 'select extent(`foo`) as extent'
      payload.delete(:identifier)
      payload.delete(:soql)

      expect(subject).to receive(:issue_request).with(payload)
      subject.get_extent({field: 'foo'}.merge(default_options))
    end
  end
end
