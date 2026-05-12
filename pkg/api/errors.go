package api

import (
	"errors"
	"fmt"
)

// APIError is what do() returns for any non-2xx response. The server may
// supply either `{"error": "..."}` (REST routes) or `{"msg": "..."}` (auth
// failures); we extract whichever is present.
type APIError struct {
	Status  int
	Code    string // optional machine-readable code (e.g. "ENTERPRISE_REQUIRED")
	Message string
	Body    string // raw body, kept for `--debug` introspection
}

func (e *APIError) Error() string {
	if e.Code != "" {
		return fmt.Sprintf("HTTP %d (%s): %s", e.Status, e.Code, e.Message)
	}
	return fmt.Sprintf("HTTP %d: %s", e.Status, e.Message)
}

// IsAuth reports whether the error is a credential rejection.
func IsAuth(err error) bool {
	var ae *APIError
	if errors.As(err, &ae) {
		return ae.Status == 401
	}
	return false
}

// IsNotFound reports whether the resource didn't exist.
func IsNotFound(err error) bool {
	var ae *APIError
	if errors.As(err, &ae) {
		return ae.Status == 404
	}
	return false
}

// IsEnterpriseRequired reports the specific 403 the server sends for
// non-enterprise accounts touching enterprise-only routes.
func IsEnterpriseRequired(err error) bool {
	var ae *APIError
	if errors.As(err, &ae) {
		return ae.Status == 403 && ae.Code == "ENTERPRISE_REQUIRED"
	}
	return false
}

// IsRetryable is what do() consults when deciding whether to back off and
// try again. 429 + 5xx + network-class errors.
func IsRetryable(err error) bool {
	var ae *APIError
	if errors.As(err, &ae) {
		return ae.Status == 429 || (ae.Status >= 500 && ae.Status <= 599)
	}
	return err != nil // transport / DNS / TLS / context errors fall here
}
