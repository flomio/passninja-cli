// import * as request from 'request-promise-native'
// import { CommandKey } from '../Messages'
// import { dbg, trc } from '../../Logging'

// export class RemoteSessionHandlerService /** extends AbstractSessionHandler */ {
//   constructor (private config: any) {}

//   handleMessage = async (body: {cmd: CommandKey, args: any}) => {
//     dbg('Sending rpc request')
//     trc('Sending rpc request', body)

//     const newVar = request.post({
//       uri:
//         this.config.sessionServer.baseUrl || 'http://localhost:4000/smart-tap',
//       resolveWithFullResponse: true,
//       body: JSON.stringify(body),
//       headers: {
//         'Content-Type': 'application/json'
//       }
//     })

//     dbg('Got http response')

//     return JSON.parse(newVar.body as string)
//   }

//   isLocal = () => false
// }
