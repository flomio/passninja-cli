package output

import (
	"strconv"
	"strings"

	"github.com/flomio/passninja-cli/pkg/api"
)

// PassTemplateTable renders a list of pass templates.
func PassTemplateTable(items []api.PassTemplate) {
	headers := []string{"ID", "Name", "Platform", "Style", "Issued", "Installed", "Created"}
	rows := make([][]string, 0, len(items))
	for _, pt := range items {
		rows = append(rows, []string{
			pt.ID,
			pt.Name,
			pt.Platform,
			pt.Style,
			strconv.Itoa(pt.IssuedPassCount),
			strconv.Itoa(pt.InstalledPassCount),
			shortTime(pt.CreatedAt),
		})
	}
	PrintTable(headers, rows)
}

// WebhookTable renders a list of webhooks.
func WebhookTable(items []api.Webhook) {
	headers := []string{"ID", "Name", "URL", "Events", "Scope", "Active", "Created"}
	rows := make([][]string, 0, len(items))
	for _, w := range items {
		scope := "account-wide"
		if w.PassTemplate != nil && *w.PassTemplate != "" {
			scope = *w.PassTemplate
		}
		rows = append(rows, []string{
			w.ID,
			w.Name,
			w.URL,
			strings.Join(w.SubscribedEvents, ","),
			scope,
			boolStr(w.Active),
			shortTime(w.CreatedAt),
		})
	}
	PrintTable(headers, rows)
}

// WebhookDetailTable renders a single webhook as a 2-column key/value
// table — useful for `webhook get` where the response is one object.
func WebhookDetailTable(w *api.Webhook) {
	scope := "account-wide"
	if w.PassTemplate != nil && *w.PassTemplate != "" {
		scope = *w.PassTemplate
	}
	headers := []string{"Field", "Value"}
	rows := [][]string{
		{"ID", w.ID},
		{"Name", w.Name},
		{"URL", w.URL},
		{"Events", strings.Join(w.SubscribedEvents, ", ")},
		{"Auth method", w.AuthMethod},
		{"Scope", scope},
		{"Active", boolStr(w.Active)},
		{"Created", w.CreatedAt},
		{"Updated", w.UpdatedAt},
	}
	if w.BearerToken != "" {
		rows = append(rows, []string{"Bearer token", w.BearerToken})
	}
	PrintTable(headers, rows)
}

// WebhookResultsTable renders the delivery history.
func WebhookResultsTable(items []api.WebhookResult) {
	headers := []string{"ID", "Attempt", "Status", "Success", "URL", "Body (truncated)", "Created"}
	rows := make([][]string, 0, len(items))
	for _, r := range items {
		status := "—"
		if r.ResponseStatus != nil {
			status = strconv.Itoa(*r.ResponseStatus)
		}
		body := ""
		if r.ResponseBody != nil {
			body = truncate(*r.ResponseBody, 80)
		}
		urlStr := ""
		if r.URL != nil {
			urlStr = *r.URL
		}
		rows = append(rows, []string{
			r.ID,
			strconv.Itoa(r.Attempt),
			status,
			boolStr(r.Success),
			urlStr,
			body,
			shortTime(r.CreatedAt),
		})
	}
	PrintTable(headers, rows)
}

// PassDetailTable renders a single pass as a key/value table — pass fields
// are template-defined so we just dump the JSON keys.
func PassDetailTable(p api.Pass) {
	headers := []string{"Field", "Value"}
	rows := make([][]string, 0, len(p))
	for k, v := range p {
		rows = append(rows, []string{k, toString(v)})
	}
	PrintTable(headers, rows)
}

func boolStr(b bool) string {
	if b {
		return "yes"
	}
	return "no"
}

func shortTime(t string) string {
	// Just the date portion for table density. Falls back to whatever the
	// server returned if the format is unexpected.
	if len(t) >= 10 && t[4] == '-' && t[7] == '-' {
		return t[:10]
	}
	return t
}

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max-1] + "…"
}

func toString(v any) string {
	switch x := v.(type) {
	case nil:
		return ""
	case string:
		return x
	case bool:
		return strconv.FormatBool(x)
	case float64:
		return strconv.FormatFloat(x, 'f', -1, 64)
	case int:
		return strconv.Itoa(x)
	default:
		return ""
	}
}
