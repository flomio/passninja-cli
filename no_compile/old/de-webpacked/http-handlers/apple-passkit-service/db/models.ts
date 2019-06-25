import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne
} from 'typeorm';

@Entity()
export class Pass {
  @PrimaryColumn()
  // @ts-ignore: ts(2564) no initializer and is not definitely assigned in the constructor
  passTypeIdentifier: string;

  @PrimaryColumn()
  // @ts-ignore: ts(2564) no initializer and is not definitely assigned in the constructor
  serialNumber: string;

  @Column({ nullable: true })
  // @ts-ignore: ts(2564) no initializer and is not definitely assigned in the constructor
  passJson: string;

  @OneToMany(() => DeviceRegistration, (reg: DeviceRegistration) => reg.device)
  // @ts-ignore: ts(2564) no initializer and is not definitely assigned in the constructor
  registrations: DeviceRegistration[];
}

@Entity()
export class Device {
  @PrimaryGeneratedColumn()
  // @ts-ignore: ts(2564) no initializer and is not definitely assigned in the constructor
  id: number;

  @Column()
  // @ts-ignore: ts(2564) no initializer and is not definitely assigned in the constructor
  deviceLibraryIdentifier: string;

  @OneToMany(() => DeviceRegistration, (reg: DeviceRegistration) => reg.device)
  // @ts-ignore: ts(2564) no initializer and is not definitely assigned in the constructor
  registrations: DeviceRegistration[];
}

@Entity()
export class DeviceRegistration {
  @PrimaryGeneratedColumn()
  // @ts-ignore: ts(2564) no initializer and is not definitely assigned in the constructor
  id: number;

  @Column()
  // @ts-ignore: ts(2564) no initializer and is not definitely assigned in the constructor
  pushToken: string;

  @OneToMany(() => Device, (device: Device) => device.registrations)
  @JoinColumn()
  // @ts-ignore: ts(2564) no initializer and is not definitely assigned in the constructor
  device: Device;

  @ManyToOne(() => Pass)
  @JoinColumn([
    { name: 'passTypeIdentifier', referencedColumnName: 'passTypeIdentifier' },
    { name: 'passSerialNumber', referencedColumnName: 'serialNumber' }
  ])
  // @ts-ignore: ts(2564) no initializer and is not definitely assigned in the constructor
  pass: Pass;
}

// Matt - I cannot find references to where this is called
//
//
// function modelPlayground() {
//     return __awaiter(this, void 0, void 0, function () {
//         return __generator(this, function (_a) {
//             typeorm_1.createConnection({
//                 type: 'sqlite',
//                 database: ':memory:',
//                 synchronize: true,
//                 logging: 'all',
//                 entities: [
//                     Pass,
//                     DeviceRegistration,
//                     Device
//                 ]
//             }).then(function (connection) {
//                 var devices = connection.getRepository(Device);
//             });
//             return [2 /*return*/];
//         });
//     });
// }
// if (__webpack_require__.c[__webpack_require__.s] === module) {
//     modelPlayground().catch(console.error);
// }

// /* WEBPACK VAR INJECTION */}.call(this,
//__webpack_require__(/*! ./../../../../node_modules/webpack/buildin/module.js */ \"./node_modules/webpack/buildin/module.js\")(module)))

// //# sourceURL=webpack://commonjs/./src/http-handlers/apple-passkit-service/db/models.ts?"
