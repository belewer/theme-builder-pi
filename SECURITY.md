# Security Policy

## Supported versions

Only the latest release receives security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.0   | :white_check_mark: |

## Reporting a vulnerability

Pi Theme Builder is a self-contained, browser-based editor that makes no external network calls, executes no commands, and loads no remote images. It exposes no arbitrary filesystem access and no command execution; the only subprocess it launches is the default browser, to open the editor URL. The `/theme-builder` integration serves only on the loopback interface (`127.0.0.1`) on a random port, and every `/api/` request must carry a per-run secret token.

If you believe you have found a vulnerability, please report it **privately** using GitHub's private vulnerability reporting:

1. Open the [Security](https://github.com/belewer/theme-builder-pi/security) tab of this repository.
2. Select **Report a vulnerability** and follow the prompts.

GitHub's private vulnerability reporting keeps the report confidential and lets the maintainers coordinate a fix and a disclosure timeline with you.

If the repository does not offer the **Report a vulnerability** option, private vulnerability reporting is not yet enabled. In that case, open an issue in this repository asking the maintainers to enable it, and **do not** include the vulnerability details in that issue. Please **do not** disclose the vulnerability publicly (for example, in a public issue, pull request, or discussion) until a fix has been released.

There is no dedicated private security email address for this project. Reports sent through other channels cannot be guaranteed the same confidentiality or triage.
