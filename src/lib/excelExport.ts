import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { type TimesheetEntry } from "@/store/timesheet";
import { timeToMinutes } from "./utils";

// Helper to get Monday of the date's week as a string identifier
function getMonday(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDay();
  // If Sunday (0), Monday was 6 days ago. Otherwise, go back day-1 days.
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
}

export async function exportTimesheetToExcel(entries: TimesheetEntry[]) {
  // 1. Filter out weekends (0 = Sunday, 6 = Saturday) and sort
  const workingEntries = entries
    .filter((e) => {
      const d = new Date(e.date);
      const day = d.getDay();
      return day !== 0 && day !== 6;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

  if (workingEntries.length === 0) {
    throw new Error("No weekday timesheet entries to export!");
  }

  // 2. Group by Week, then by Date
  // Structure: { weekStr: { dateStr: TimesheetEntry[] } }
  const groupedByWeek = workingEntries.reduce(
    (acc, curr) => {
      const week = getMonday(curr.date);
      if (!acc[week]) acc[week] = {};
      if (!acc[week][curr.date]) acc[week][curr.date] = [];
      acc[week][curr.date].push(curr);
      return acc;
    },
    {} as Record<string, Record<string, TimesheetEntry[]>>,
  );

  const weeks = Object.keys(groupedByWeek).sort();

  // 3. Setup Workbook & Worksheet
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Timesheet");

  // Define Columns
  sheet.columns = [
    { header: "Tanggal", key: "tanggal", width: 20 },
    { header: "Jam Masuk", key: "masuk", width: 15 },
    { header: "Jam Pulang", key: "pulang", width: 15 },
    { header: "Total Jam Kerja", key: "total_jam", width: 18 },
    { header: "Total Hari Kerja", key: "total_hari", width: 18 },
    { header: "Aktivitas", key: "aktivitas", width: 45 },
  ];

  // Set default font
  sheet.columns.forEach((column) => {
    column.font = { name: "Times New Roman", size: 10 };
  });

  // Format Headers
  const headerRow = sheet.getRow(1);
  headerRow.font = {
    name: "Times New Roman",
    size: 10,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF004B87" }, // Dark blue
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  let currentRowNum = 2;
  const subtotalRows: number[] = [];

  // 4. Fill Data By Week
  for (const weekStr of weeks) {
    const datesInWeek = groupedByWeek[weekStr];
    const dateKeys = Object.keys(datesInWeek).sort();

    const weekStartRow = currentRowNum;

    for (const dateStr of dateKeys) {
      const dayEntries = datesInWeek[dateStr];
      const dateStartRow = currentRowNum;

      for (let i = 0; i < dayEntries.length; i++) {
        const entry = dayEntries[i];
        const diffMins =
          timeToMinutes(entry.endTime) - timeToMinutes(entry.startTime);
        const diffHrs = parseFloat((diffMins / 60).toFixed(2));

        const row = sheet.getRow(currentRowNum);
        row.getCell("masuk").value = entry.startTime;
        row.getCell("pulang").value = entry.endTime;
        row.getCell("total_jam").value = diffHrs;
        row.getCell("aktivitas").value = entry.activity;

        // Apply borders and alignment (up to column F)
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          if (colNumber <= 6) {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
            cell.alignment = {
              vertical: "middle",
              wrapText: true,
              horizontal: colNumber >= 4 && colNumber <= 5 ? "center" : "left", // Center Total Jam & Hari
            };

            if (colNumber === 2 || colNumber === 3) {
              cell.alignment.horizontal = "center"; // Center times
            }
          }
        });

        currentRowNum++;
      }

      const dateEndRow = currentRowNum - 1;

      // Merge Tanggal vertically
      if (dateStartRow < dateEndRow) {
        sheet.mergeCells(`A${dateStartRow}:A${dateEndRow}`);
      }
      const tanggalCell = sheet.getCell(`A${dateStartRow}`);
      tanggalCell.value = dateStr;
      tanggalCell.alignment = { vertical: "middle", horizontal: "center" };

      // Make "Total Hari Kerja" 1 per day, merged for the day so it can be summed easily per week
      if (dateStartRow < dateEndRow) {
        sheet.mergeCells(`E${dateStartRow}:E${dateEndRow}`);
      }
      const hariKerjaCell = sheet.getCell(`E${dateStartRow}`);
      hariKerjaCell.value = 1;
      hariKerjaCell.alignment = { vertical: "middle", horizontal: "center" };
    }

    const weekEndRow = currentRowNum - 1;

    // 5. Append "Total per minggu" row for the week
    const sumRow = currentRowNum;
    subtotalRows.push(sumRow);

    sheet.mergeCells(`A${sumRow}:C${sumRow}`);
    const subtotalLabelCell = sheet.getCell(`A${sumRow}`);
    subtotalLabelCell.value = "Total per minggu";
    subtotalLabelCell.font = { name: "Times New Roman", size: 10, bold: true };
    subtotalLabelCell.alignment = { horizontal: "center", vertical: "middle" };

    // Sum of hours for the week
    const hoursSumCell = sheet.getCell(`D${sumRow}`);
    hoursSumCell.value = { formula: `SUM(D${weekStartRow}:D${weekEndRow})` };
    hoursSumCell.font = { name: "Times New Roman", size: 10, bold: true };
    hoursSumCell.alignment = { horizontal: "center", vertical: "middle" };

    // Sum of days for the week
    const daysSumCell = sheet.getCell(`E${sumRow}`);
    daysSumCell.value = { formula: `SUM(E${weekStartRow}:E${weekEndRow})` };
    daysSumCell.font = { name: "Times New Roman", size: 10, bold: true };
    daysSumCell.alignment = { horizontal: "center", vertical: "middle" };

    // Formatting for the subtotal row
    const subtotalRowObj = sheet.getRow(sumRow);
    subtotalRowObj.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber <= 6) {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      }
    });

    // Proceed to next week with a gap OR just continue. Continuing looks better.
    currentRowNum++;
  }

  // 6. Grand Total
  if (subtotalRows.length > 0) {
    const grandRow = currentRowNum;
    sheet.mergeCells(`A${grandRow}:C${grandRow}`);
    const grandLabelCell = sheet.getCell(`A${grandRow}`);
    grandLabelCell.value = "Grand Total";
    grandLabelCell.font = { name: "Times New Roman", bold: true, size: 10 };
    grandLabelCell.alignment = { horizontal: "center", vertical: "middle" };

    const grandHoursSumCell = sheet.getCell(`D${grandRow}`);
    grandHoursSumCell.value = {
      formula: `SUM(${subtotalRows.map((r) => `D${r}`).join(",")})`,
    };
    grandHoursSumCell.font = { name: "Times New Roman", bold: true, size: 10 };
    grandHoursSumCell.alignment = { horizontal: "center", vertical: "middle" };

    const grandDaysSumCell = sheet.getCell(`E${grandRow}`);
    grandDaysSumCell.value = {
      formula: `SUM(${subtotalRows.map((r) => `E${r}`).join(",")})`,
    };
    grandDaysSumCell.font = { name: "Times New Roman", bold: true, size: 10 };
    grandDaysSumCell.alignment = { horizontal: "center", vertical: "middle" };

    const grandRowObj = sheet.getRow(grandRow);
    grandRowObj.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber <= 6) {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      }
    });
  }

  // 7. Write to buffer and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, "Timesheet-Report.xlsx");
}
