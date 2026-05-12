package api

import (
	"io"
	"os"
)

var debugSink io.Writer = os.Stderr

func debugWriter() io.Writer { return debugSink }

// SetDebugWriter lets tests capture client debug output.
func SetDebugWriter(w io.Writer) { debugSink = w }

const maxDebugBody = 2048

func truncateForDebug(b []byte) string {
	if len(b) <= maxDebugBody {
		return string(b)
	}
	return string(b[:maxDebugBody]) + "...(truncated)"
}
