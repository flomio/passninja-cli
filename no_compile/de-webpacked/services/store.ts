import { BehaviorSubject } from 'rxjs';

export class StateStoreService {
  MAX_PASSES = 20;
  latestPkPass = new BehaviorSubject<any>(null);
  passes = [];

  setPass = (pass: any, buffer: Buffer) => {
    this.latestPkPass.next(buffer);

    let index = this.findPass({
      passTypeIdentifier: pass.passTypeIdentifier,
      serialNumber: pass.serialNumber
    }).index;

    if (index) {
      this.passes.splice(index, 1);
    }

    const lastModified = new Date().toUTCString();

    this.passes.unshift({
      pass,
      buffer,
      lastModified
    });

    while (this.passes.length > this.MAX_PASSES) {
      this.passes.pop();
    }
  };

  findPass = params => {
    const index = this.passes.findIndex(
      p =>
        p.pass.passTypeIdentifier === params.passTypeIdentifier &&
        p.pass.serialNumber === params.serialNumber
    );

    return { index, pass: this.passes[index] };
  };
}
