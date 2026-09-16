# Backup

Open Reports → Backup. JSON is the restorable format; Excel is for reference. Both read all four database tables with pagination, including hidden accounts and soft-deleted records. Excel includes raw Members, Matches, Expenses and Cash Transactions sheets, plus Income, Transfers and Settings. Income/Transfers are views of Cash Transactions, not additional transactions to add to totals.

JSON contains IDs, audit fields, deletion flags, relationships, creation time, format version and currency. Currency is fixed to QAR; this app has no configurable settings table. Device identity and database credentials are not included.

Restore validates the file and relationships, previews counts, detects unique name/match-number conflicts, and downloads a current JSON safety backup before confirmation. It upserts by ID in dependency order. Records absent from the backup remain. This is a merge restore, not a point-in-time database replacement. Existing matching records, including deletion flags, are overwritten.

The current API does not support transactions across tables. If a network/database error interrupts restore, the screen reports how many records were confirmed; earlier batches remain saved. Keep the safety backup and retry after resolving the error. Avoid concurrent editing while downloading or restoring; paginated reads are not an atomic database snapshot. No schema migration is required.

Validation: `node backup.test.cjs`. The separate `work/backup-browser-check.cjs` uses mocked data and does not modify the live database.
