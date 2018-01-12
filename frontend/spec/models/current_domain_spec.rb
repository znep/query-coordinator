require 'rails_helper'

describe CurrentDomain, :type => :model do
  include TestHelperMethods

  before(:all) do
    init_current_domain
    CurrentDomain.class_variable_set('@@property_store', {})
  end

  it 'handles the case when last_refresh is a String' do
    CurrentDomain.class_variable_set('@@update_times', 'whatevs' => Time.now)
    allow(CurrentDomain).to receive(:last_refresh).with('whatevs').and_return('a string')
    expect(CurrentDomain).to receive(:flag_out_of_date!).with('whatevs')
    CurrentDomain.check_for_theme_update('whatevs')
  end

  it 'handles the case when last_refresh is a Time and in the past' do
    CurrentDomain.class_variable_set('@@update_times', 'thedomain' => Time.now)
    allow(CurrentDomain).to receive(:last_refresh).with('thedomain').and_return(Time.now - 300)
    expect(CurrentDomain).to receive(:flag_out_of_date!).with('thedomain').never
    expect(CurrentDomain).not_to receive(:reload)
    CurrentDomain.check_for_theme_update('thedomain')
  end

  it 'handles the case when last_refresh is a Time and in the future' do
    CurrentDomain.class_variable_set('@@update_times', 'adomain' => Time.now)
    allow(CurrentDomain).to receive(:last_refresh).with('adomain').and_return(Time.now + 300)
    expect(CurrentDomain).not_to receive(:flag_out_of_date!).with('adomain')
    expect(CurrentDomain).to receive(:reload).once
    CurrentDomain.check_for_theme_update('adomain')
  end

  it 'handles the case when last_refresh is nil' do
    CurrentDomain.class_variable_set('@@update_times', 'youthere' => Time.now)
    allow(CurrentDomain).to receive(:last_refresh).with('youthere').and_return(nil)
    expect(CurrentDomain).to receive(:flag_out_of_date!).with('youthere')
    CurrentDomain.check_for_theme_update('youthere')
  end

  context 'membership test' do

    let(:mock_user) { double('user', rights: mock_rights) }
    let(:mock_rights) { nil }

    context 'when user is nil' do
      it 'returns false' do
        assert_equal(false, CurrentDomain.member?(nil))
      end
    end

    context 'when rights are nil' do
      it 'returns false' do
        assert_equal(false, CurrentDomain.member?(mock_user))
      end
    end

    context 'when rights are empty' do
      let(:mock_rights) { [] }

      it 'returns false' do
        assert_equal(false, CurrentDomain.member?(mock_user))
      end
    end

    context 'when rights are present' do
      let(:mock_rights) { %w(right) }

      it 'returns true' do
        assert_equal(true, CurrentDomain.member?(mock_user))
      end
    end

  end

  # TODO: verify this behavior with Randy
  describe 'configUpdatedAt' do
    context 'when configUpdatedAt property is not nil', :verify_stubs => false do
      before do
        allow_any_instance_of(Domain).to receive(:configUpdatedAt).and_return(1489081200)
      end

      it 'returns the expected timestamp' do
        expect(CurrentDomain.configUpdatedAt).to eq(1489081200)
      end

      it 'return the same value using snake case' do
        expect(CurrentDomain.config_updated_at).to eq(1489081200)
      end
    end

    context 'when configUpdatedAt property is nil' do
      before do
        allow(Time).to receive(:now).and_return(Time.at(1489081493))
      end

      it 'returns the expected quantized timestamp' do
        expect(CurrentDomain.configUpdatedAt).to eq(1489081500)
      end

      it 'return the same quantized value using snake case' do
        expect(CurrentDomain.config_updated_at).to eq(1489081500)
      end
    end
  end

end
