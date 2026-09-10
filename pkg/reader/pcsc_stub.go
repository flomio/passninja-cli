//go:build !(windows || ((darwin || linux) && cgo))

package reader

import (
	"context"
	"errors"

	"github.com/flomio/passninja-cli/pkg/api"
)

const pcscAvailable = false

// servePCSC is unavailable in this build: the PC/SC binding needs cgo on
// macOS and Linux, which cross-compiled release binaries lack. Build natively
// (`go install` / Homebrew from source) for --pcsc support.
func servePCSC(_ context.Context, _ *api.Client, _ Options) error {
	return errors.New("this build has no PC/SC support: install natively with `go install github.com/flomio/passninja-cli@latest` (cgo required on macOS/Linux)")
}
