# NAP Audit

A dependency-free Node.js tool for checking whether a local business's name, address, and phone number agree across directory listings.

## Run an audit

With Node.js installed, run the fictional example from the repository directory.

```sh
node audit.mjs example.json
```

The JSON report lists missing and mismatched fields with their directory, expected value, and observed value. Exit code 0 means all fields matched, 1 means the report has findings, and 2 means the input could not be processed. The example reports a mismatched address and a missing phone number.

To audit your own listings, copy [example.json](example.json) to a new file. Put your reference name, address, and phone number in `business`. Add one entry per directory in `listings`, with a `source` label and the values shown in that directory. Use `null` or omit a field if the directory does not show it. Pass your new filename to the command.

The tool compares data you provide and runs locally. Business names and addresses are matched case-insensitively with whitespace normalization. Phone numbers ignore formatting and treat a leading international 00 like +. Supply country codes consistently. Street abbreviations, alternate business names, and local dialing formats can require human review.

## Contributing

Open an issue or pull request with a fictional example that reproduces the problem. Useful contributions include documented normalization rules for additional countries.

Licensed under [MIT](LICENSE).
