require_relative '../test_helper'

class CardTypeMappingTest < Test::Unit::TestCase

  def standard_config
    {
      :map => {
        :datatype_with_one_visualization_only => { type: 'visualization' }
      },
      :cardinality => {
        :min => 2,
        :threshold => 35
      }
    }
  end

  def standard_instance
    @card_type_mapping ||= CardTypeMapping.new(standard_config)
  end

  describe 'constructor' do
    def test_requires_map_key_in_config_object
      # Sanity check, this should work fine.
      CardTypeMapping.new(
        :map => {},
        :cardinality => {
          :min => 2,
          :threshold => 35
        }
      )
      assert_raises(ArgumentError) do
        CardTypeMapping.new(
          :cardinality => {
            :min => 2,
            :threshold => 35
          }
        )
      end
      assert_raises(ArgumentError) do
        CardTypeMapping.new(
          :map => nil,
          :cardinality => {
            :min => 2,
            :threshold => 35
          }
        )
      end
    end

    def test_requires_cardinality_object_in_config_object
      # Sanity check, this should work fine.
      CardTypeMapping.new(
        :map => {},
        :cardinality => {
          :min => 2,
          :threshold => 35
        }
      )
      assert_raises(ArgumentError) do
        CardTypeMapping.new(
          :map => {},
        )
      end
      assert_raises(ArgumentError) do
        CardTypeMapping.new(
          :map => {},
          :cardinality => {
            :threshold => 35
          }
        )
      end
      assert_raises(ArgumentError) do
        CardTypeMapping.new(
          :map => {},
          :cardinality => {
            :min => 2,
          }
        )
      end
    end
  end

  def self.with_map(map)
    CardTypeMapping.new(
      :map => map,
      :cardinality => {
        :min => 2,
        :threshold => 35
      }
    )
  end

  def self.low_cardinality_column(physical_datatype)
    {
      :physicalDatatype => physical_datatype,
      :cardinality => 10
    }
  end

  def self.high_cardinality_column(physical_datatype)
    {
      :physicalDatatype => physical_datatype,
      :cardinality => 1000
    }
  end
      
  describe 'defaultVisualizationForColumn' do
    describe 'for a defined physical datatype' do
        describe 'with only one visualization defined with no defaultIf conditions' do
          it 'should return the single visualization' do
            assert_equal(
              'testViz',
              CardTypeMappingTest.with_map( :testPT => [ { :type => 'testViz' } ]).
                card_type_for(CardTypeMappingTest.low_cardinality_column('testPT'))
            )
          end
        end

        describe 'with only one visualization defined with a defaultIf condition' do
          describe 'that is invalid' do
            it 'should throw' do
              assert_raises(UnsupportedCardTypeMappingExpression) do
                CardTypeMappingTest.with_map( :testPT => [
                  {
                    :type => 'testViz',
                    :defaultIf => 'isNotACondition'
                  }
                ]).card_type_for(CardTypeMappingTest.low_cardinality_column('testPT'))
              end
            end
          end
          describe 'that is isLowCardinality' do
            ctm = CardTypeMappingTest.with_map( :testPT => [
              {
                :type => 'testViz',
                :defaultIf => 'isLowCardinality'
              }
            ])
            describe 'that evaluates to either true or false' do
              it 'should return the single visualization' do
                assert_equal('testViz', ctm.card_type_for(CardTypeMappingTest.low_cardinality_column('testPT')))
                assert_equal('testViz', ctm.card_type_for(CardTypeMappingTest.high_cardinality_column('testPT')))
              end
            end
          end
        end
        describe 'with multiple defined visualizations' do
          describe 'when only some visualizations have an onlyIf evaluating to true' do
            it 'should return the first visualization which is  not excluded' do
              ctm = CardTypeMappingTest.with_map(
                testPT: [
                  { type: 'testViz1', onlyIf: 'isHighCardinality' },
                  { type: 'testViz2', onlyIf: 'isHighCardinality' },
                  { type: 'testViz3', onlyIf: 'isLowCardinality' },
                  { type: 'testViz4', onlyIf: 'isLowCardinality' }
                ]
              )
              assert_equal('testViz3', ctm.card_type_for(CardTypeMappingTest.low_cardinality_column('testPT')))
            end
          end
          describe 'when no visualizations have an onlyIf evaluating to true' do
            it 'should return nil' do
              ctm = CardTypeMappingTest.with_map(
                testPT: [
                  { type: 'testViz1', onlyIf: 'isHighCardinality' },
                  { type: 'testViz2', onlyIf: 'isGeoregionComputed' }
                ]
              )
              assert_nil(ctm.card_type_for(CardTypeMappingTest.low_cardinality_column('testPT')))
            end
          end
          describe 'when faced with defaultIf expressions' do
            describe 'when all visualizations have defaultIf evaluating to true' do
              describe 'but some have onlyIf evaluating to false' do
                it 'should return the first unexcluded visualization' do
                  ctm = CardTypeMappingTest.with_map(
                    testPT: [
                      { type: 'testViz1', defaultIf: 'isLowCardinality', onlyIf: 'isHighCardinality'},
                      { type: 'testViz2', defaultIf: 'isLowCardinality' },
                      { type: 'testViz3', defaultIf: 'isGeoregionComputed' }
                    ]
                  )
                  low_cardinality_geo_column = {
                    physicalDatatype: 'testPT',
                    cardinality: 10,
                    computationStrategy: 'georegion_match_on_string'
                  }

                  assert_equal('testViz2', ctm.card_type_for(low_cardinality_geo_column))
                end
              end

              it 'should return the first visualization' do
                ctm = CardTypeMappingTest.with_map(
                  testPT: [
                    { type: 'testViz1', defaultIf: 'isGeoregionComputed' },
                    { type: 'testViz2', defaultIf: 'isLowCardinality' }
                  ]
                )

                low_cardinality_geo_column = {
                  physicalDatatype: 'testPT',
                  cardinality: 10,
                  computationStrategy: 'georegion_match_on_string'
                }

                assert_equal('testViz1', ctm.card_type_for(low_cardinality_geo_column))
              end
            end
            describe 'when some columns have no defaultIf but the rest do' do
              it 'should return the first visualization with a defaultIf = true' do
                ctm = CardTypeMappingTest.with_map(
                  testPT: [
                    { type: 'testViz1' },
                    { type: 'testViz2', defaultIf: 'isHighCardinality' },
                    { type: 'testViz3', defaultIf: 'isLowCardinality' },
                    { type: 'testViz4', defaultIf: 'isLowCardinality' }
                  ]
                )
                assert_equal('testViz3', ctm.card_type_for(CardTypeMappingTest.low_cardinality_column('testPT')))
              end
            end
            describe 'when some columns have no defaultIf but the rest do, all evaluating to false' do
              it 'should return the first visualization with no defaultIf expression' do
                ctm = CardTypeMappingTest.with_map(
                  testPT: [
                    { type: 'testViz1', defaultIf: 'isHighCardinality' },
                    { type: 'testViz2', defaultIf: 'isGeoregionComputed' },
                    { type: 'testViz3' }
                  ]
                )
                assert_equal('testViz3', ctm.card_type_for(CardTypeMappingTest.low_cardinality_column('testPT')))
              end
            end
          end
        end

      describe 'for an undefined physical datatype' do
        it 'should return nil' do
          ctm = CardTypeMappingTest.with_map(
            testPT: [ { type: 'testViz' } ]
          );
          assert_nil(ctm.card_type_for(CardTypeMappingTest.low_cardinality_column('invlidDatatype')))
        end
    end
  end

  end
end
