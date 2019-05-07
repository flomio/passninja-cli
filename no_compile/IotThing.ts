import { IoT, Fn, Refs } from 'cloudform'

const iotThing = new IoT.Thing({
  ThingName: Fn.Join('-', ['pn-broker', Fn.Ref('Stage')])
})
