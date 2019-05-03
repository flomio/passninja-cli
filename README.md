# Configuring 

## Prerequisites

```
$ node -v
v11.3.0
$ npm -v
6.4.1
```

## Install Dependencies

Even though the cli is bundled into a single JavaScript file, there are some
native extensions and other modules which are required to be installed
separately.

```bash
npm install
```

## Install drivers

Go to ACS 1255U reader [download page](https://www.acs.com.hk/en/products/403/acr1255u-j1-secure-bluetooth%C2%AE-nfc-reader/)

Download the [pcsc drivers](https://www.acs.com.hk/download-driver-unified/9184/ACS-Unified-Driver-Lnx-Mac-115-P.zip)

## Enable escape commands 

After installing, to enable escape commands you must edit a configuration file
using admin privileges. Once completed the modifications you may need to reboot your
machine for charnges to take effect. 

On OSX:

```bash
sudo nano /usr/local/libexec/SmartCardServices/drivers/ifd-acsccid.bundle/Contents/Info.plist 
```

Edit the `<string>` with  `ifdDriversOptions` `<key>` and set the 
`DRIVER_OPTION_CCID_EXCHANGE_AUTHORIZED` bit:

```
<!-- Possible values for ifdDriverOptions
0x01: DRIVER_OPTION_CCID_EXCHANGE_AUTHORIZED
        the CCID Exchange command is allowed. You can use it through
        SCardControl(hCard, IOCTL_SMARTCARD_VENDOR_IFD_EXCHANGE, ...)
```

eg.

```
<key>ifdDriverOptions</key>
<string>0x0001</string>
```

## Run the headless client

From the root directory of the repo run:
```
./bin/start-pn.sh
```

You can setup a background daemon with autostart actions by [following tese instructions.](https://github.com/flomio/flomio_apps_server/wiki/faq15%3A-How-do-I-setup-RPi3-or-PiZero%3F#setup-the-pi-to-autostart) 
