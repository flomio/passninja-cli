package oauth

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/flomio/passninja-cli/pkg/session"
)

const deviceCodeGrant = "urn:ietf:params:oauth:grant-type:device_code"

// defaultPollInterval applies when the server omits `interval` (RFC 8628
// §3.2). A var so tests can poll fast.
var defaultPollInterval = 5 * time.Second

// DeviceCode is the authorization server's answer to a device login start.
type DeviceCode struct {
	DeviceCode              string `json:"device_code"`
	UserCode                string `json:"user_code"`
	VerificationURI         string `json:"verification_uri"`
	VerificationURIComplete string `json:"verification_uri_complete"`
	ExpiresIn               int    `json:"expires_in"`
	Interval                int    `json:"interval"`
	Error                   string `json:"error"`
	ErrorDescription        string `json:"error_description"`
}

// DeviceLogin runs the device authorization grant (RFC 8628) for hosts
// that can't receive a browser redirect — an SSH session, a container. The
// user opens the verification URL on any device, signs in, and confirms the
// code; meanwhile this polls the token endpoint.
//
// announce is called once with the code to show the user.
func (c Config) DeviceLogin(ctx context.Context, announce func(*DeviceCode)) (*session.Session, error) {
	var dc DeviceCode
	if _, err := c.postForm(ctx, "/oauth/device_authorization", url.Values{
		"client_id": {ClientID},
		"scope":     {strings.Join(Scopes, " ")},
	}, &dc); err != nil {
		return nil, err
	}
	if dc.Error != "" {
		return nil, &OAuthError{Code: dc.Error, Description: dc.ErrorDescription}
	}
	if announce != nil {
		announce(&dc)
	}

	interval := time.Duration(dc.Interval) * time.Second
	if interval <= 0 {
		interval = defaultPollInterval
	}
	ctx, cancel := context.WithTimeout(ctx, time.Duration(dc.ExpiresIn)*time.Second)
	defer cancel()

	for {
		select {
		case <-time.After(interval):
		case <-ctx.Done():
			if errors.Is(ctx.Err(), context.DeadlineExceeded) {
				return nil, errors.New("the device code expired before it was confirmed; run `passninja login --device` again")
			}
			return nil, ctx.Err()
		}

		s, err := c.exchange(ctx, url.Values{
			"grant_type":  {deviceCodeGrant},
			"device_code": {dc.DeviceCode},
		})
		if err == nil {
			return s, nil
		}
		var oe *OAuthError
		if !errors.As(err, &oe) {
			return nil, err
		}
		switch oe.Code {
		case "authorization_pending":
			continue
		case "slow_down":
			// RFC 8628 §3.5: back off by 5 seconds for every slow_down.
			interval += 5 * time.Second
			continue
		case "access_denied":
			return nil, errors.New("login was cancelled in the browser")
		case "expired_token":
			return nil, errors.New("the device code expired before it was confirmed; run `passninja login --device` again")
		default:
			return nil, fmt.Errorf("device login failed: %w", err)
		}
	}
}
