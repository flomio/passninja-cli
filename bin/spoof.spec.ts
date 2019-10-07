import { spoof } from './spoof';

spoof('google').then(
  (spoof: any) => console.log(spoof.topic, spoof.message),
  (err: Error) => console.error(err)
);
