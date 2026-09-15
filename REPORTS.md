# QFK reports

Reports includes Share Match Report and Full Reports. The latest match date is selected by default. Copy generates plain group-message text; exports generate branded PDF and XLSX files locally in the browser.

## Balance dates

Cash opening balance includes ledger entries before the start date. Closing cash includes all entries through the end date. Match reports use the match date, including all cash movements that day. Other matches' movements and adjustments are shown separately. Expenses dated after the match day are excluded with a warning. Full Reports can include them using the date range.

Dates have no time or match-close snapshot in the existing database. Multiple matches on one date therefore share a day-end cash cutoff. Reports reflect the current saved records; editing or soft-deleting an old record changes a regenerated historical report.

Transfers move balances between members and do not create income or expenses. Only active, non-deleted members appear in cash-holder lists. Historical cash remains in the group total; cash outside the visible account list is disclosed without account names. Missing recipients, inconsistent totals and unknown holders are flagged for review; the report does not silently repair records.

Income currently means match collections, consistent with the existing data model. Adjustments are separate. No database migration is needed.

## Verification

Run `node reports.test.cjs`. Tests cover date cutoffs, opening cash, transfers, inactive holders, deleted entries, reconciliation and currency rounding. Browser checks should use fixture data without changing the live database, download PDF/XLSX from both report views, and inspect mobile layout and multipage output.

## Dependencies

Vendored browser builds: jsPDF 3.0.3 (MIT), jsPDF-AutoTable 5.0.2 (MIT), ExcelJS 4.4.0 (MIT). Upstream copyright notices are retained in the distributions. These files are served from the same site so export does not require a third-party script download at runtime.

Logo: supplied QFK crest, with exterior background removed, used for UI, favicon and report header.
