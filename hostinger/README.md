# Hostinger backend

This folder is the isolated PHP/MySQL backend for `portal.dcampaign.com`.
Upload it inside the portal subdomain directory (for example
`/public_html/portal/api`). Copy `config.example.php` to `config.php` and fill
in the Hostinger database credentials in hPanel. Never commit `config.php`.

Import `schema.sql` into the dedicated Hostinger database before using the API.

To create the first admin, set a private `setup_key` in `config.php`, upload
`setup-admin.php`, open it once, then delete the file immediately after the
account is created.
