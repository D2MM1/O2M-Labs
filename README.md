# CSV Validator

A clean, privacy-focused web tool that validates CSV files with quoted field support. Built for O2M Labs.

**Live Demo:** [https://D2MM1/O2M-Labs.github.io/](https:/D2MM1/O2M-Labs.github.io/)

---

## Features

- **Upload or Paste** — load CSV from file or clipboard
- **Custom Delimiter** — comma, semicolon, tab, or custom character
- **Quoted Field Support** — handles `"Hello, world"` correctly
- **Auto-Detection** — suggests correct delimiter on mismatch
- **Optional Rules** — regex validation, minimum column length, column consistency
- **Privacy First** — all processing happens in your browser, no data uploaded
- **Mobile Responsive** — works on smartphones and tablets
- **Fix Invalid CSVs** — download corrected version with error column

---

## How It Works

1. **Load CSV** — upload a file or paste CSV data
2. **Choose delimiter** — select the character separating columns
3. **Validate** — checks column consistency and optional rules
4. **Fix if invalid** — download corrected CSV with error explanations

---

## Pages

- **Home** — main validator interface
- **How It Works** — guided tour of features
- **FAQ** — common questions and answers
- **Privacy** — data handling policy

---

## Tech Stack

- **HTML5 / CSS3** — semantic markup, responsive design
- **JavaScript (ES6)** — client-side validation logic
- **Papa Parse** — robust CSV parsing with quoted field support
- **Netlify / GitHub Pages** — static hosting

---

## Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/csv-validator.git
