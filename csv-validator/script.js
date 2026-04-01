// CSV Validator Script
// Validates CSV against user-specified delimiter
// Only modifies output if invalid AND user requests fix

// Utility: Detect delimiter from first row
function detectDelimiter(text) {
    const delimiters = [',', ';', '\t', '|'];
    let maxCount = 0, best = ',';
    const firstLine = text.split('\n')[0];
    delimiters.forEach(d => {
        const count = firstLine.split(d).length;
        if (count > maxCount) { 
            maxCount = count; 
            best = d; 
        }
    });
    return best;
}

// Parse CSV with specific delimiter using Papa Parse
function parseCSV(text, delimiter) {
    return Papa.parse(text, {
        delimiter: delimiter,
        quoteChar: '"',
        skipEmptyLines: true
    }).data;
}

// Validate if all rows have consistent column count
function validateStructure(rows) {
    if (rows.length === 0) return { valid: false, error: 'Empty CSV' };
    
    const firstRowLength = rows[0].length;
    const invalidRows = [];
    
    for (let i = 1; i < rows.length; i++) {
        if (rows[i].length !== firstRowLength) {
            invalidRows.push({
                rowNumber: i + 1,
                expected: firstRowLength,
                actual: rows[i].length,
                preview: rows[i].slice(0, 3).join(', ')
            });
        }
    }
    
    if (invalidRows.length > 0) {
        return {
            valid: false,
            error: 'inconsistent_columns',
            firstRowLength: firstRowLength,
            invalidRows: invalidRows,
            totalRows: rows.length
        };
    }
    
    return { valid: true, rows: rows.length, columns: firstRowLength };
}

// Annotate rows with error column (only for invalid CSV fix)
function annotateRowsWithErrors(rows, invalidRows) {
    const annotated = [rows[0].concat('Error')];
    const invalidRowNumbers = new Set(invalidRows.map(r => r.rowNumber));
    
    for (let i = 1; i < rows.length; i++) {
        const rowNumber = i + 1;
        let errorMsg = '';
        
        if (invalidRowNumbers.has(rowNumber)) {
            const invalid = invalidRows.find(r => r.rowNumber === rowNumber);
            errorMsg = `Expected ${invalid.expected} columns, found ${invalid.actual}`;
        }
        
        annotated.push(rows[i].concat(errorMsg));
    }
    
    return annotated;
}

// UI Elements
const form = document.getElementById('csv-form');
const fileInput = document.getElementById('csv-file');
const delimiterSelect = document.getElementById('delimiter');
const customDelimiterInput = document.getElementById('custom-delimiter');
const outputDelimiterSelect = document.getElementById('output-delimiter');
const resultsDiv = document.getElementById('results');
const downloadBtn = document.getElementById('download-btn');
const copyBtn = document.getElementById('copy-btn');
const toast = document.getElementById('toast');
const csvTextarea = document.getElementById('csv-textarea');

let lastOriginalCSV = '';
let lastValidState = null;
let lastInvalidRows = null;
let lastRows = null;

// Show/hide custom delimiter input
delimiterSelect.addEventListener('change', function() {
    customDelimiterInput.style.display = delimiterSelect.value === 'custom' ? 'inline-block' : 'none';
});

function showToast(msg, success = true) {
    toast.textContent = msg;
    toast.className = 'toast ' + (success ? 'toast-success' : 'toast-error');
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    let csvContent = '';
    
    if (csvTextarea.value.trim()) {
        csvContent = csvTextarea.value;
    } else if (fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            handleValidation(evt.target.result);
        };
        reader.readAsText(fileInput.files[0]);
        return;
    } else {
        showToast('Please upload a CSV file or paste data.', false);
        return;
    }
    
    handleValidation(csvContent);
});

function handleValidation(csvContent) {
    // Get user-specified delimiter
    let userDelimiter = delimiterSelect.value;
    if (userDelimiter === 'auto') {
        userDelimiter = detectDelimiter(csvContent);
    } else if (userDelimiter === 'custom') {
        userDelimiter = customDelimiterInput.value || ',';
    }
    
    // Parse with user delimiter
    let rows = parseCSV(csvContent, userDelimiter);
    
    if (!rows.length || (rows.length === 1 && rows[0].length === 1 && !rows[0][0])) {
        resultsDiv.innerHTML = '<div class="error">No valid CSV data found. Check your format.</div>';
        showToast('No valid data found.', false);
        return;
    }
    
    // Validate structure
    const validation = validateStructure(rows);
    
    lastOriginalCSV = csvContent;
    lastRows = rows;
    lastValidState = validation.valid;
    
    if (validation.valid) {
        // VALID CSV: Output original unchanged
        lastInvalidRows = null;
        
        const successHtml = `
            <div class="summary-success">
                <strong>✓ CSV is VALID</strong><br>
                Rows: ${validation.rows} (including header)<br>
                Columns: ${validation.columns}<br>
                Delimiter used: "${userDelimiter}"
            </div>
            <div class="valid-csv-display">
                <details>
                    <summary>View original CSV (unchanged)</summary>
                    <pre class="csv-preview">${escapeHtml(lastOriginalCSV)}</pre>
                </details>
            </div>
        `;
        
        resultsDiv.innerHTML = successHtml;
        downloadBtn.style.display = 'none';
        copyBtn.style.display = 'none';
        showToast('CSV is valid! No changes needed.', true);
        
    } else {
        // INVALID CSV: Show errors and offer fix
        lastInvalidRows = validation.invalidRows;
        
        let errorHtml = `
            <div class="summary-error">
                <strong>✗ CSV is INVALID</strong><br>
                Problem: Inconsistent column counts<br>
                First row has ${validation.firstRowLength} columns<br>
                Found ${validation.invalidRows.length} row(s) with mismatched counts
            </div>
            <div class="error-details">
                <strong>Problem rows:</strong>
                <ul>
        `;
        
        validation.invalidRows.slice(0, 10).forEach(row => {
            errorHtml += `<li>Row ${row.rowNumber}: expected ${row.expected} columns, found ${row.actual} columns<br>
                          <span class="preview">Preview: ${escapeHtml(row.preview)}</span></li>`;
        });
        
        if (validation.invalidRows.length > 10) {
            errorHtml += `<li>... and ${validation.invalidRows.length - 10} more rows</li>`;
        }
        
        errorHtml += `
                </ul>
            </div>
            <div class="fix-options">
                <button id="fixBtn" class="btn-fix">Fix CSV (add Error column)</button>
                <button id="cancelBtn" class="btn-cancel">Cancel</button>
            </div>
        `;
        
        resultsDiv.innerHTML = errorHtml;
        downloadBtn.style.display = 'none';
        copyBtn.style.display = 'none';
        
        document.getElementById('fixBtn')?.addEventListener('click', () => {
            generateFixedCSV(userDelimiter);
        });
        
        document.getElementById('cancelBtn')?.addEventListener('click', () => {
            resultsDiv.innerHTML = '<div class="info">Validation cancelled. Fix CSV data and try again.</div>';
        });
        
        showToast(`CSV invalid: ${validation.invalidRows.length} row(s) with column mismatch`, false);
    }
}

function generateFixedCSV(userDelimiter) {
    if (!lastRows || !lastInvalidRows) return;
    
    // Annotate rows with errors
    const annotatedRows = annotateRowsWithErrors(lastRows, lastInvalidRows);
    
    // Get output delimiter preference
    let outputDelimiter = outputDelimiterSelect.value || ',';
    
    // Generate fixed CSV
    let fixedCsv = Papa.unparse(annotatedRows, {
        delimiter: outputDelimiter,
        skipEmptyLines: false
    });
    
    lastOriginalCSV = fixedCsv;
    
    // Show preview and offer download
    resultsDiv.innerHTML = `
        <div class="summary-success">
            <strong>✓ Fixed CSV Ready</strong><br>
            Added "Error" column with descriptions of issues.<br>
            Original CSV was modified to fix delimiter issues.
        </div>
        <div class="fixed-csv-preview">
            <details open>
                <summary>Preview (Error column added)</summary>
                <pre class="csv-preview">${escapeHtml(fixedCsv.substring(0, 2000))}${fixedCsv.length > 2000 ? '\n... (truncated)' : ''}</pre>
            </details>
        </div>
        <div class="action-buttons">
            <button id="downloadFixedBtn" class="btn-download">Download Fixed CSV</button>
            <button id="copyFixedBtn" class="btn-copy">Copy to Clipboard</button>
        </div>
    `;
    
    downloadBtn.style.display = 'none';
    copyBtn.style.display = 'none';
    
    document.getElementById('downloadFixedBtn')?.addEventListener('click', () => {
        const blob = new Blob([fixedCsv], {type: 'text/csv'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fixed.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Fixed CSV downloaded!', true);
    });
    
    document.getElementById('copyFixedBtn')?.addEventListener('click', () => {
        navigator.clipboard.writeText(fixedCsv).then(() => {
            showToast('Fixed CSV copied to clipboard!', true);
        });
    });
}
