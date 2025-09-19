// A simple function to convert an array of objects to CSV
const convertToCSV = (objArray: any[]) => {
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    if (array.length === 0) return '';
    
    // Dynamically get all headers, including from customData
    const headerSet = new Set<string>();
    array.forEach(row => {
        Object.keys(row).forEach(key => {
            if (key === 'customData' && typeof row[key] === 'object' && row[key] !== null) {
                Object.keys(row[key]).forEach(customKey => {
                    headerSet.add(customKey);
                });
            } else {
                headerSet.add(key);
            }
        });
    });
    
    const headers = Array.from(headerSet);
    let str = headers.map(h => `"${h}"`).join(',') + '\r\n';

    for (let i = 0; i < array.length; i++) {
        let line = '';
        for (const header of headers) {
            if (line !== '') line += ',';
            
            let value = array[i][header];
            if (value === null || value === undefined) {
                 // If not found at top level, check inside customData
                 value = array[i].customData?.[header];
            }
             if (value === null || value === undefined) {
                value = '';
            } else if (typeof value === 'object') {
                value = JSON.stringify(value);
            }

            if (typeof value === 'string') {
                value = value.replace(/"/g, '""'); // Escape double quotes
            }
            line += `"${value}"`;
        }
        str += line + '\r\n';
    }
    return str;
};

// Triggers a file download in the browser
const triggerDownload = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};

/**
 * Converts an array of data to a CSV and triggers a download.
 * @param data - The array of objects to convert.
 * @param filename - The desired filename without extension.
 */
export const downloadCsv = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
        alert("No data to download.");
        return;
    }
    const csvData = convertToCSV(data);
    triggerDownload(csvData, `${filename}_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
};

/**
 * Downloads a CSV template file with only headers.
 * @param headers - An array of strings representing the CSV headers.
 */
export const downloadTemplate = (headers: string[]) => {
    if (!headers || headers.length === 0) return;
    const headerString = headers.map(h => `"${h}"`).join(',');
    triggerDownload(headerString, `template.csv`, 'text/csv;charset=utf-8;');
};