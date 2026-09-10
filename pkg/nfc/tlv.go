// Package nfc implements the wire formats a PassNinja reader host speaks over
// a PC/SC contactless interface: BER-TLV and NDEF encoding, the Apple VAS
// read flow, and the Google Smart Tap 2.1 read flow. The package builds the
// APDUs and parses the responses; it performs no decryption — captured
// payloads are submitted to POST /scans, where the server holds the keys.
package nfc

// tlvTemplates are constructed tags whose value is itself TLV-encoded and
// should be recursed into when searching.
var tlvTemplates = map[uint32]bool{
	0x6F: true, 0x70: true, 0xA5: true, 0x61: true, 0x73: true, 0xBF0C: true,
}

// TLVFind returns the value of the first occurrence of tag in a BER-TLV byte
// string, recursing into known template tags. Returns nil when absent or when
// the input is malformed.
func TLVFind(data []byte, tag uint32) []byte {
	pairs, ok := tlvParse(data)
	if !ok {
		return nil
	}
	for _, p := range pairs {
		if p.tag == tag {
			return p.value
		}
		if tlvTemplates[p.tag] {
			if v := TLVFind(p.value, tag); v != nil {
				return v
			}
		}
	}
	return nil
}

type tlvPair struct {
	tag   uint32
	value []byte
}

func tlvParse(data []byte) ([]tlvPair, bool) {
	var out []tlvPair
	i := 0
	for i < len(data) {
		if data[i] == 0x00 || data[i] == 0xFF { // padding
			i++
			continue
		}
		tag := uint32(data[i])
		i++
		if tag&0x1F == 0x1F { // multi-byte tag
			for {
				if i >= len(data) {
					return out, false
				}
				tag = tag<<8 | uint32(data[i])
				i++
				if data[i-1]&0x80 == 0 {
					break
				}
			}
		}
		if i >= len(data) {
			return out, false
		}
		length := int(data[i])
		i++
		if length&0x80 != 0 { // long form
			n := length & 0x7F
			if n == 0 || n > 4 || i+n > len(data) {
				return out, false
			}
			length = 0
			for j := 0; j < n; j++ {
				length = length<<8 | int(data[i+j])
			}
			i += n
		}
		if i+length > len(data) {
			return out, false
		}
		out = append(out, tlvPair{tag: tag, value: data[i : i+length]})
		i += length
	}
	return out, true
}
