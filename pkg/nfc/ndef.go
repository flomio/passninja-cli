package nfc

import (
	"encoding/binary"
	"errors"
)

// NdefRecord is one record of an NDEF message. Smart Tap stores its record
// type in the type field for EXTERNAL (TNF 4) records and in the id field for
// WELL_KNOWN (TNF 1) records; Name resolves that convention.
type NdefRecord struct {
	TNF     byte
	Type    []byte
	ID      []byte
	Payload []byte
}

// Name returns the Smart Tap record type string ("ngr", "ses", "n", ...).
func (r NdefRecord) Name() string {
	if r.TNF == 0x04 {
		return string(r.Type)
	}
	if len(r.ID) > 0 {
		return string(r.ID)
	}
	return string(r.Type)
}

// NdefParse strictly parses one NDEF message. It errors on malformed input:
// bad TNF, missing MB on the first record, overflow, or trailing bytes after
// the ME record.
func NdefParse(data []byte) ([]NdefRecord, error) {
	if len(data) == 0 {
		return nil, errors.New("ndef: empty message")
	}
	var records []NdefRecord
	i := 0
	for i < len(data) {
		hdr := data[i]
		if len(records) == 0 && hdr&0x80 == 0 {
			return nil, errors.New("ndef: first record missing MB")
		}
		if hdr&0x07 > 0x06 {
			return nil, errors.New("ndef: bad TNF")
		}
		i++
		if i >= len(data) {
			return nil, errors.New("ndef: truncated header")
		}
		typeLen := int(data[i])
		i++
		var payloadLen int
		if hdr&0x10 != 0 { // SR
			if i >= len(data) {
				return nil, errors.New("ndef: truncated length")
			}
			payloadLen = int(data[i])
			i++
		} else {
			if i+4 > len(data) {
				return nil, errors.New("ndef: truncated length")
			}
			payloadLen = int(binary.BigEndian.Uint32(data[i : i+4]))
			i += 4
		}
		idLen := 0
		if hdr&0x08 != 0 { // IL
			if i >= len(data) {
				return nil, errors.New("ndef: truncated id length")
			}
			idLen = int(data[i])
			i++
		}
		if i+typeLen+idLen+payloadLen > len(data) {
			return nil, errors.New("ndef: record overflows message")
		}
		rec := NdefRecord{
			TNF:     hdr & 0x07,
			Type:    append([]byte(nil), data[i:i+typeLen]...),
			ID:      append([]byte(nil), data[i+typeLen:i+typeLen+idLen]...),
			Payload: append([]byte(nil), data[i+typeLen+idLen:i+typeLen+idLen+payloadLen]...),
		}
		i += typeLen + idLen + payloadLen
		records = append(records, rec)
		if hdr&0x40 != 0 { // ME
			break
		}
	}
	if i != len(data) {
		return nil, errors.New("ndef: trailing bytes after ME record")
	}
	return records, nil
}

// NdefBuild encodes records as one NDEF message: MB on the first record, ME
// on the last, SR whenever the payload fits in one byte. IDs are not emitted
// (Smart Tap request records carry the type in the type field).
func NdefBuild(records []NdefRecord) []byte {
	var out []byte
	for idx, r := range records {
		hdr := r.TNF
		if idx == 0 {
			hdr |= 0x80
		}
		if idx == len(records)-1 {
			hdr |= 0x40
		}
		short := len(r.Payload) < 256
		if short {
			hdr |= 0x10
		}
		out = append(out, hdr, byte(len(r.Type)))
		if short {
			out = append(out, byte(len(r.Payload)))
		} else {
			var l [4]byte
			binary.BigEndian.PutUint32(l[:], uint32(len(r.Payload)))
			out = append(out, l[:]...)
		}
		out = append(out, r.Type...)
		out = append(out, r.Payload...)
	}
	return out
}

// NdefFind returns the first record whose Smart Tap name matches.
func NdefFind(records []NdefRecord, name string) *NdefRecord {
	for i := range records {
		if records[i].Name() == name {
			return &records[i]
		}
	}
	return nil
}

// external is shorthand for an EXTERNAL (TNF 4) record.
func external(typ string, payload []byte) NdefRecord {
	return NdefRecord{TNF: 0x04, Type: []byte(typ), Payload: payload}
}
