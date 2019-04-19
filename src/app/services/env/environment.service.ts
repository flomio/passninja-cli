import * as os from "os"

export class EnvironmentService {
  isLinux = () => os.platform() === "linux"

  platform = () => os.platform()

  isOSX = () => this.platform() === "darwin"
}
