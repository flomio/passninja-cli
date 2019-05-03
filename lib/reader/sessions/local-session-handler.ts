import { SessionHandler } from './abstract-session-handler'
import { CommandKey } from '../messages';
import * as appleVAS from 'apple-vas-data-decrypt'
import { fromBase64 } from '../reader';

export class LocalSessionHandler implements SessionHandler {
 
  constructor(
    private config: any
  ) {}

  getDecrypter = () => {
    const key1 = this.config.nfc.keys.appleVAS.keys[0]
    const decrypter = appleVAS.makeDecrypter(
      this.config.nfc.selectPassTypeIdentifier,
      key1.privateKeyPem
    )
    return decrypter
  }
  
  handleMessage(cmd: CommandKey, args: any) {
    switch(cmd) { 
      case CommandKey.decrypt_vas_data: { 
        const decrypter = this.getDecrypter()
        const decrypted = decrypter(
          fromBase64(args.response)
        )
  
        if (!decrypted.success) {
          console.log(decrypted.error)
        }
  
        return {
          cmd: CommandKey.decrypted_vas_data,
          args: { data: decrypted.data }
        } 
      }
      default: { 
         //statements; 
         break; 
      } 
    } 
   
    
  }
}