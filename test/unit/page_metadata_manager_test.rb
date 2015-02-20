require 'test_helper'

class PageMetadataManagerTest < Test::Unit::TestCase

  def setup
    CurrentDomain.stubs(domain: stub(cname: 'localhost'))
    NewViewManager.any_instance.stubs(:create)
    Phidippides.any_instance.stubs(connection_details: {
      'address' => 'localhost',
      'port' => '2401'
    })
    SodaFountain.any_instance.stubs(connection_details: {
      'address' => 'localhost',
      'port' => '6010'
    })
  end

  def test_create_succeeds
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(3)

    Phidippides.any_instance.stubs(
      create_page_metadata: { status: '200', body: v0_page_metadata },
      fetch_dataset_metadata: { status: '200', body: v0_dataset_metadata }
    )

    stub_feature_flags_with(:metadata_transition_phase, '0')
    result = manager.create(v0_page_metadata.to_json)
    assert(result.fetch(:status) == '200', 'Expected create result status to be 200')
    assert(result.fetch(:body).fetch(:pageId), 'Expected a non-nil pageId to be created')

    stub_feature_flags_with(:metadata_transition_phase, '1')
    result = manager.create(v0_page_metadata.to_json)
    assert(result.fetch(:status) == '200', 'Expected create result status to be 200')
    assert(result.fetch(:body).fetch(:pageId), 'Expected a non-nil pageId to be created')

ONCE WE ANSWER QUESTIONS ABOUT HOW TO CREATE PAGES WE CAN PROCEED HERE

  end

  def test_create_does_not_try_to_create_rollup_table_when_not_given_eligible_columns
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(0)
    Phidippides.any_instance.stubs(
      create_page_metadata: { status: '200', body: v0_page_metadata },
      fetch_dataset_metadata: { status: '200', body: v0_dataset_metadata_without_rollup_columns }
    )
    stub_feature_flags_with(:metadata_transition_phase, '0')

    # Make sure our assumptions about the dataset we're using are true
    rollup_column_doesnt_exist = v0_dataset_metadata_without_rollup_columns['columns'].none? do |column|
      column['logicalDatatype'] == 'category'
    end
    assert(rollup_column_doesnt_exist)
    rollup_column_exists = v0_dataset_metadata['columns'].find do |column|
      column['logicalDatatype'] == 'category'
    end
    assert(rollup_column_exists)

    result = manager.create(v0_page_metadata.to_json)

    assert(result.fetch(:status) == '200', 'Expected create result status to be 200')
    assert(result.fetch(:body).fetch(:pageId), 'Expected a non-nil pageId to be created')
  end

  def test_create_ensures_table_card
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(1)
    Phidippides.any_instance.stubs(
      fetch_dataset_metadata: { status: '200', body: v0_dataset_metadata }
    )
    stub_feature_flags_with(:metadata_transition_phase, '0')

    Phidippides.any_instance.expects(:create_page_metadata).times(1).then.with do |json, options|
      assert(json['cards'].pluck('cardType').any? { |cardType| cardType == 'table' })
      assert_equal({}, options)
    end.then.returns(
      status: '200',
      body: v0_page_metadata
    )

    result = manager.create(v0_page_metadata_without_tablecard.to_json)
    assert(result.fetch(:status) == '200', 'Expected create result status to be 200')
  end

  def test_update_succeeds
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(2)
    Phidippides.any_instance.stubs(
      create_page_metadata: { status: '200', body: v0_page_metadata },
      fetch_dataset_metadata: { status: '200', body: v0_dataset_metadata }
    )
    stub_feature_flags_with(:metadata_transition_phase, '0')

    manager.create(v0_page_metadata.to_json)

    Phidippides.any_instance.expects(:update_page_metadata).times(1).then.with do |json, options|
      assert(json.fetch(:bunch))
      assert(json.fetch(:foo))
      assert_equal({}, options)
    end.then.returns(
      status: '200',
      body: v0_page_metadata
    )

    manager.update(v0_page_metadata.merge('bunch' => 'other stuff', 'foo' => 'bar'))
  end

  def test_update_does_not_delete_rollup_first
    SodaFountain.any_instance.expects(:delete_rollup_table).never
    SodaFountain.any_instance.stubs(create_or_update_rollup_table: { status: 204 })
    Phidippides.any_instance.stubs(
      create_page_metadata: { status: '200', body: v0_page_metadata },
      fetch_dataset_metadata: { status: '200', body: v0_dataset_metadata },
      fetch_page_metadata: { status: '200', body: v0_page_metadata },
      update_page_metadata: { status: '200', body: v0_page_metadata }
    )
    stub_feature_flags_with(:metadata_transition_phase, '0')

    result = manager.create(v0_page_metadata.to_json)

    assert(result[:status] == '200', 'Expected create result status to be 200')
    manager.update(result.fetch(:body).to_json)
  end

  # Yes, this is a private method, but it warranted at least some unit testing
  def test_build_soql
    manager.stubs(phidippides: stub(fetch_dataset_metadata: { body: v0_dataset_metadata }))
    stub_feature_flags_with(:metadata_transition_phase, '0')

    soql = manager.send(:build_rollup_soql, v0_page_metadata)
    assert_equal('select location_description, primary_type, count(*) as value group by location_description, primary_type', soql)

    # This needs to be tested for each phase of the metadata transition
  end

  private

  def manager
    @manager ||= PageMetadataManager.new
  end

  def v0_page_metadata
    @v0_page_metadata ||= JSON.parse(File.read("#{Rails.root}/test/fixtures/v0-page-metadata.json")).with_indifferent_access
  end

  def v0_page_metadata_without_tablecard
    v0_page_metadata.dup.tap do |page_md|
      page_md['cards'].select! { |card| card['fieldName'] != '*' }
    end
  end

  def v1_page_metadata
    @v1_page_metadata ||= JSON.parse(File.read("#{Rails.root}/test/fixtures/v1-page-metadata.json")).with_indifferent_access
  end

  def v1_page_metadata_without_tablecard
    v1_page_metadata.dup.tap do |page_md|
      page_md['cards'].select! { |card| card['fieldName'] != '*' }
    end
  end

  def v0_dataset_metadata
    @v0_dataset_metadata ||= JSON.parse(File.read("#{Rails.root}/test/fixtures/v0-dataset-metadata.json")).with_indifferent_access
  end

  def v0_dataset_metadata_without_rollup_columns
    v0_dataset_metadata.dup.tap do |dataset_md|
      dataset_md['columns'] = dataset_md['columns'].reject do |column|
        %w(category location).include?(column['logicalDatatype'])
      end
    end
  end

  def v1_dataset_metadata
    @v1_dataset_metadata ||= JSON.parse(File.read("#{Rails.root}/test/fixtures/v1-dataset-metadata.json")).with_indifferent_access
  end

  def v1_dataset_metadata_without_rollup_columns
    v1_dataset_metadata.dup.tap do |dataset_md|
      dataset_md['columns'] = dataset_md['columns'].reject do |column|
        %w(category location).include?(column['logicalDatatype'])
      end
    end
  end

end
