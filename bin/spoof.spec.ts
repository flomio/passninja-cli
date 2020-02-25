import { spoof } from '../bin/spoof';
require('dotenv').config();
jest.setTimeout(20000);
it('spoofs a apple boarding pass', async function() {
  expect(
    await spoof(
      'apple',
      'gas.democoupon',
      '5adc37df-d9ff-4398-9d5b-34f5c0d6da00'
    )
  ).toContain('"message":"5adc37df-d9ff-4398-9d5b-34f5c0d6da00"');
});
