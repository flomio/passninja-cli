#!/bin/bash -u
# We use set -e and bash with -u to bail on first non zero exit code of any
# processes launched or upon any unbound variable.
# We use set -x to print commands before running them to help with
# debugging.
set -ex

#export PASS_COM_TICKETMASTER_NFC_PASSPHRASE='C289D380-447A-4596-8CA2-16526C6FF70D'
#export PASS_COM_VOLVO_NFC_PASSPHRASE='8976DDAF-D9E2-4130-8167-7046AD0AE64D'
#export PASS_COM_JETBRAINS_NFC_PASSPHRASE='dd64c6b7-3b16-462f-867f-e6b3fabb8a11'
export PASS_COM_NDUDFIELD_NFC_PASSPHRASE='zxccxz'

# the reltive paths below will need be replaced with absolute paths for init.rc service to run properly
PN_NFC_KEYS=$PWD/pn-nfc-keys.json node $PWD/no_compile/compiled-src/pn.js\
    --user=demo@user.com \
    --password="Pass!@#\$334--" \
    --stage 'test'
#    --scan-report-end-point=http://localhost:8080 \
#    --offline \
#    --certs-path=$PWD/keys \
#    --sign-pass=adidas.pass
