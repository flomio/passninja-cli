package api

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

const (
	DefaultBaseURL = "https://api.passninja.com/v1"
	DefaultTimeout = 30 * time.Second
)

// Client wraps the PassNinja REST API. Authentication is one of two modes:
//
//   - Header-pair (default): sends X-API-KEY + X-ACCOUNT-ID. Set via
//     NewClient(apiKey, accountID).
//   - Bearer: sends Authorization: Bearer <token>, leaving the account to
//     be resolved server-side from the OAuth access token. Set via
//     WithBearerToken; when present it takes precedence over the pair.
//
// The bearer mode exists so the MCP HTTP transport can forward an OAuth
// access token straight through to /v1, whose oauthBearerAuth middleware
// already validates it — no token validation is duplicated client-side.
type Client struct {
	BaseURL     string
	APIKey      string
	AccountID   string
	BearerToken string
	HTTPClient  *http.Client
	UserAgent   string
	Debug       bool
}

type Option func(*Client)

// WithBearerToken puts the client in OAuth bearer mode: requests carry
// Authorization: Bearer <token> instead of the X-API-KEY/X-ACCOUNT-ID pair.
func WithBearerToken(token string) Option {
	return func(c *Client) { c.BearerToken = token }
}

func WithHTTPClient(h *http.Client) Option {
	return func(c *Client) { c.HTTPClient = h }
}

func WithBaseURL(u string) Option {
	return func(c *Client) {
		if u != "" {
			c.BaseURL = u
		}
	}
}

func WithUserAgent(ua string) Option {
	return func(c *Client) { c.UserAgent = ua }
}

func WithDebug(b bool) Option {
	return func(c *Client) { c.Debug = b }
}

func NewClient(apiKey, accountID string, opts ...Option) *Client {
	c := &Client{
		BaseURL:    DefaultBaseURL,
		APIKey:     apiKey,
		AccountID:  accountID,
		HTTPClient: &http.Client{Timeout: DefaultTimeout},
		UserAgent:  "passninja-cli/dev",
	}
	for _, opt := range opts {
		opt(c)
	}
	c.BaseURL = strings.TrimRight(c.BaseURL, "/")
	return c
}

// retry schedule: 250ms, 750ms, 2s. Capped at 3 attempts total.
var retryDelays = []time.Duration{250 * time.Millisecond, 750 * time.Millisecond, 2 * time.Second}

// do executes a request, JSON-encoding `body` if non-nil and JSON-decoding
// the response body into `out` if it's non-nil and the response is 2xx.
// Retries on 429 / 5xx / transport errors per retryDelays.
func (c *Client) do(ctx context.Context, method, path string, body, out any) error {
	var bodyBytes []byte
	if body != nil {
		var err error
		bodyBytes, err = json.Marshal(body)
		if err != nil {
			return fmt.Errorf("marshal request body: %w", err)
		}
	}

	fullURL := c.BaseURL + path
	if c.Debug {
		fmt.Fprintf(debugWriter(), "[passninja] %s %s\n", method, fullURL)
		if body != nil {
			fmt.Fprintf(debugWriter(), "[passninja] req body: %s\n", string(bodyBytes))
		}
	}

	var lastErr error
	for attempt := 0; attempt <= len(retryDelays); attempt++ {
		if attempt > 0 {
			// Honor Retry-After if the previous response surfaced it as part
			// of an APIError; otherwise use our static backoff schedule.
			delay := retryDelays[attempt-1]
			if ra := retryAfter(lastErr); ra > 0 {
				delay = ra
			}
			select {
			case <-time.After(delay):
			case <-ctx.Done():
				return ctx.Err()
			}
		}

		req, err := http.NewRequestWithContext(ctx, method, fullURL, bytes.NewReader(bodyBytes))
		if err != nil {
			return fmt.Errorf("build request: %w", err)
		}
		if c.BearerToken != "" {
			req.Header.Set("Authorization", "Bearer "+c.BearerToken)
		} else {
			req.Header.Set("X-API-KEY", c.APIKey)
			req.Header.Set("X-ACCOUNT-ID", c.AccountID)
		}
		req.Header.Set("User-Agent", c.UserAgent)
		req.Header.Set("Accept", "application/json")
		if bodyBytes != nil {
			req.Header.Set("Content-Type", "application/json")
		}

		resp, err := c.HTTPClient.Do(req)
		if err != nil {
			lastErr = err
			if IsRetryable(err) {
				continue
			}
			return err
		}

		ok, apiErr, respBody := readResponse(resp)
		_ = resp.Body.Close()

		if c.Debug {
			fmt.Fprintf(debugWriter(), "[passninja] resp %d body: %s\n", resp.StatusCode, truncateForDebug(respBody))
		}

		if ok {
			if out != nil && len(respBody) > 0 {
				if err := json.Unmarshal(respBody, out); err != nil {
					return fmt.Errorf("decode response: %w (body: %s)", err, truncateForDebug(respBody))
				}
			}
			return nil
		}

		// non-2xx — attach Retry-After if present so the next loop honors it
		apiErr.attachRetryAfter(resp.Header.Get("Retry-After"))
		lastErr = apiErr
		if !IsRetryable(apiErr) {
			return apiErr
		}
	}

	return lastErr
}

// readResponse pulls the body, decides 2xx vs error, and on error attempts
// to extract `{error}` or `{msg}` (and `{code}`) for a friendlier message.
func readResponse(resp *http.Response) (ok bool, apiErr *APIError, body []byte) {
	body, _ = io.ReadAll(resp.Body)
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return true, nil, body
	}
	apiErr = &APIError{Status: resp.StatusCode, Body: string(body)}
	var parsed struct {
		Error string `json:"error"`
		Msg   string `json:"msg"`
		Code  string `json:"code"`
	}
	if json.Unmarshal(body, &parsed) == nil {
		switch {
		case parsed.Error != "":
			apiErr.Message = parsed.Error
		case parsed.Msg != "":
			apiErr.Message = parsed.Msg
		default:
			apiErr.Message = strings.TrimSpace(string(body))
		}
		apiErr.Code = parsed.Code
	} else {
		apiErr.Message = strings.TrimSpace(string(body))
	}
	if apiErr.Message == "" {
		apiErr.Message = http.StatusText(resp.StatusCode)
	}
	return false, apiErr, body
}

// retryAfterPlaceholder is a no-op marker stored on APIError so the do()
// loop can extract a Retry-After hint without exposing http.Header to callers.
func (e *APIError) attachRetryAfter(v string) {
	if v == "" {
		return
	}
	if secs, err := strconv.Atoi(v); err == nil && secs >= 0 {
		e.Body = "retry-after:" + strconv.Itoa(secs) + ";" + e.Body
	}
}

func retryAfter(err error) time.Duration {
	if err == nil {
		return 0
	}
	var ae *APIError
	if !errors.As(err, &ae) {
		return 0
	}
	if !strings.HasPrefix(ae.Body, "retry-after:") {
		return 0
	}
	parts := strings.SplitN(ae.Body, ";", 2)
	secsStr := strings.TrimPrefix(parts[0], "retry-after:")
	secs, err := strconv.Atoi(secsStr)
	if err != nil || secs <= 0 {
		return 0
	}
	// Cap at 30s so we don't disappear into a long backoff on a misbehaving server.
	if secs > 30 {
		secs = 30
	}
	return time.Duration(secs) * time.Second
}

// queryString joins the kv pairs (skipping empties) and prefixes with "?".
func queryString(params map[string]string) string {
	if len(params) == 0 {
		return ""
	}
	v := url.Values{}
	for k, val := range params {
		if val == "" {
			continue
		}
		v.Set(k, val)
	}
	if len(v) == 0 {
		return ""
	}
	return "?" + v.Encode()
}
