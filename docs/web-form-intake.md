# Automatic website form intake

The portal accepts secure server-to-server form submissions at:

`POST https://portal.dcampaign.com/api/crm/web-forms/ingest`

Set the same long random `WEB_FORM_INGEST_SECRET` environment variable in both the DCampaign website backend and this portal. The website must send it in an `Authorization: Bearer <secret>` header. Never expose it in browser JavaScript.

Send JSON using these field names. Empty fields can be omitted:

```json
{
  "submissionId": "unique-id-from-your-form-provider",
  "submittedAtUtc": "2026-09-18T10:30:00.000Z",
  "submittedAtIst": "2026-09-18 16:00:00 IST",
  "submissionType": "Contact enquiry",
  "formName": "Homepage contact form",
  "sourcePage": "https://dcampaign.com/",
  "fullName": "Name",
  "email": "name@example.com",
  "phone": "+91 90000 00000",
  "company": "Company name",
  "message": "Message from the visitor"
}
```

The endpoint deduplicates matching `submissionId` values; resending the same submission updates it instead of adding another row.

For Google Sheets, use an installable Apps Script “On form submit” trigger. The trigger should map each new sheet row to this JSON and use `UrlFetchApp.fetch()` to post it to the endpoint with the authorization header. Keep the secret in Apps Script Properties, not in the spreadsheet.
