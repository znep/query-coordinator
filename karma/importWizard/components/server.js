import TestUtils from 'react-addons-test-utils';

import {
  transformToImports2Translation
} from 'server';

describe('server.js testing', () => {

    describe('basic blueprint generation', () => {
        const transform = JSON.parse('[{"sourceColumn":{"name":"user_id","processed":3,"suggestion":"number","types":{"number":3,"text":3,"calendar_date":3,"money":3,"percent":3},"index":0},"name":"user_id","chosenType":"number","transforms":[],"showColumnTransforms":true},{"sourceColumn":{"name":"first","processed":3,"suggestion":"number","types":{"number":3,"text":3,"calendar_date":3,"money":3,"percent":3},"index":1},"name":"first","chosenType":"number","transforms":[]},{"sourceColumn":{"name":"second","processed":3,"suggestion":"text","types":{"number":0,"text":3,"calendar_date":0,"money":0,"percent":0},"index":2},"name":"second","chosenType":"text","transforms":[]},{"sourceColumn":{"name":"third","processed":3,"suggestion":"number","types":{"number":3,"text":3,"calendar_date":3,"money":3,"percent":3},"index":3},"name":"third","chosenType":"number","transforms":[]},{"sourceColumn":{"name":"fourth","processed":3,"suggestion":"text","types":{"number":0,"text":3,"calendar_date":0,"money":0,"percent":0},"index":4},"name":"fourth","chosenType":"text","transforms":[]}]');

        const result = transformToImports2Translation(transform);

        expect(result).to.equal('[col1,col2,col3,col4,col5]');
    });

    describe('more complicated blueprint generation', () => {
        const transform = JSON.parse('[{"sourceColumn":{"name":"user_id","processed":3,"suggestion":"number","types":{"number":3,"text":3,"calendar_date":3,"money":3,"percent":3},"index":0},"name":"user_id","chosenType":"number","transforms":[{"type":"title"},{"type":"upper"},{"type":"lower"},{"type":"toStateCode"},{"type":"findReplace","findText":"abc","replaceText":"def","caseSensitive":true}],"showColumnTransforms":true},{"sourceColumn":{"name":"first","processed":3,"suggestion":"number","types":{"number":3,"text":3,"calendar_date":3,"money":3,"percent":3},"index":1},"name":"first","chosenType":"number","transforms":[]},{"sourceColumn":{"name":"second","processed":3,"suggestion":"text","types":{"number":0,"text":3,"calendar_date":0,"money":0,"percent":0},"index":2},"name":"second","chosenType":"text","transforms":[]},{"sourceColumn":{"name":"third","processed":3,"suggestion":"number","types":{"number":3,"text":3,"calendar_date":3,"money":3,"percent":3},"index":3},"name":"third","chosenType":"number","transforms":[]},{"sourceColumn":{"name":"fourth","processed":3,"suggestion":"text","types":{"number":0,"text":3,"calendar_date":0,"money":0,"percent":0},"index":4},"name":"fourth","chosenType":"text","transforms":[]}]');

        const result = transformToImports2Translation(transform);

        expect(result).to.equal('[(toStateCode(lower(upper(title(col1))))).replace(/abc/g, "def"),col2,col3,col4,col5]');
    });

});
