import FileSaver from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportToCSV<T>(data: T[], filename: string, columns: { header: string; key: keyof T | ((row: T) => string) }[]) {
  if (data.length === 0) return;

  const headers = columns.map((col) => col.header).join(",");
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const val = typeof col.key === "function" ? col.key(row) : row[col.key];
        return `"${String(val || "").replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csv = [headers, ...rows].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  FileSaver.saveAs(blob, `${filename}.csv`);
}

export function exportToExcel<T>(data: T[], filename: string, columns: { header: string; key: keyof T | ((row: T) => string) }[]) {
  if (data.length === 0) return;

  const exportData = data.map((row) => {
    const rowData: Record<string, string> = {};
    columns.forEach((col) => {
      rowData[col.header] = String(typeof col.key === "function" ? col.key(row) : row[col.key] || "");
    });
    return rowData;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToPDF<T>(data: T[], filename: string, title: string, columns: { header: string; key: keyof T | ((row: T) => string) }[]) {
  if (data.length === 0) return;

  const doc = new jsPDF();
  doc.text(title, 14, 15);

  const body = data.map((row) =>
    columns.map((col) => String(typeof col.key === "function" ? col.key(row) : row[col.key] || ""))
  );

  autoTable(doc, {
    head: [columns.map((col) => col.header)],
    body,
    startY: 20,
    styles: { font: "helvetica", fontSize: 10 },
  });

  doc.save(`${filename}.pdf`);
}
