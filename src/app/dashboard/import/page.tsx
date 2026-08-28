"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import * as XLSX from "xlsx";
import { FileUp, Loader2, CheckCircle2, ChevronRight, AlertTriangle, ArrowLeft, Eye, HelpCircle } from "lucide-react";
import Link from "next/link";

const cleanCategory = (catStr: string): string => {
  if (!catStr) return "Others";
  
  // Strip emojis and leading/trailing spaces
  let clean = catStr.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "");
  clean = clean.trim();
  
  const lower = clean.toLowerCase();
  
  // Custom mappings for common divisions in user's sheet
  if (lower.includes("delhi") || lower.includes("room")) return "Delhi Room";
  if (lower.includes("ajit")) return "Ajit";
  if (lower.includes("swarna")) return "Swarna";
  if (lower.includes("home") || lower.includes("baba")) return "Home";
  if (lower.includes("food")) return "Food";
  if (lower.includes("travel")) return "Travel";
  if (lower.includes("recharge")) return "Recharge";
  if (lower.includes("salary")) return "Salary";
  if (lower.includes("bonus")) return "Bonus";
  if (lower.includes("shopping")) return "Shopping";
  if (lower.includes("gift")) return "Gift";
  if (lower.includes("puri")) return "Puri";
  
  // Capitalize the first letter if it's a new custom category
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

export default function ExcelImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetsList, setSheetsList] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  
  // Parsed records state
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [mappedData, setMappedData] = useState<any[]>([]);
  const [headersMap, setHeadersMap] = useState<Record<string, string>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setError("");
    setSuccess("");
    setParsedRows([]);
    setMappedData([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: "binary" });
        setWorkbook(wb);
        setSheetsList(wb.SheetNames);
        if (wb.SheetNames.length > 0) {
          setSelectedSheet(wb.SheetNames[0]);
          parseSheet(wb, wb.SheetNames[0]);
        }
      } catch (err: any) {
        setError("Failed to read Excel file. Make sure it is a valid .xlsx file.");
        console.error(err);
      } finally {
        setParsing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSheetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sheetName = e.target.value;
    setSelectedSheet(sheetName);
    if (workbook) {
      parseSheet(workbook, sheetName);
    }
  };

  // Parses the sheet and dynamically maps standard headers
  const parseSheet = (wb: XLSX.WorkBook, sheetName: string) => {
    try {
      const ws = wb.Sheets[sheetName];
      // Convert sheet to json array of arrays to inspect raw rows
      const rawRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
      
      if (rawRows.length < 2) {
        setError("Selected worksheet is empty or lacks enough rows.");
        return;
      }

      // Find the actual headers row by scanning for columns 'category' and ('date' or 'period')
      let headerRowIndex = -1;
      for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (Array.isArray(row)) {
          const hasCategory = row.some(cell => cell && String(cell).toLowerCase().trim().includes("category"));
          const hasDateOrPeriod = row.some(cell => {
            if (!cell) return false;
            const s = String(cell).toLowerCase().trim();
            return s.includes("date") || s.includes("period");
          });
          if (hasCategory && hasDateOrPeriod) {
            headerRowIndex = i;
            break;
          }
        }
      }

      if (headerRowIndex === -1) {
        setError("Could not find a valid headers row containing 'Category' and 'Date' or 'Period' (Make sure your headers are visible).");
        return;
      }

      const headers = rawRows[headerRowIndex] as string[];
      const bodyRows = rawRows.slice(headerRowIndex + 1);

      // Find standard column index maps
      const mappings: Record<string, string> = {};
      const finalMapped: any[] = [];

      // Check header columns by scanning names
      headers.forEach((h: any) => {
        if (!h) return;
        const name = String(h).toLowerCase().trim();

        if (name.includes("date") || name.includes("period")) {
          mappings["date"] = h;
        } else if (name.includes("category") && !name.includes("sub")) {
          mappings["category"] = h;
        } else if (name.includes("note")) {
          mappings["note"] = h;
        } else if (name.includes("description") || name.includes("detail")) {
          mappings["description"] = h;
        } else if (name.includes("amount") || name.includes("inr") || name.includes("price")) {
          mappings["amount"] = h;
        } else if (name.includes("type") || name.includes("income/expense") || name.includes("inc/exp")) {
          mappings["type"] = h;
        }
      });

      setHeadersMap(mappings);

      // Convert body rows into objects matching mappings
      bodyRows.forEach((row: any[]) => {
        if (!row || row.length === 0) return;

        const record: any = {};
        let hasData = false;

        headers.forEach((h, idx) => {
          const val = row[idx];
          if (val !== undefined && val !== null && String(val).trim() !== "") {
            hasData = true;
          }
        });

        if (!hasData) return; // Skip completely empty rows

        // Retrieve properties based on resolved map
        const rawDate = row[headers.indexOf(mappings["date"])];
        const rawCategory = row[headers.indexOf(mappings["category"])];
        const rawNote = row[headers.indexOf(mappings["note"])];
        const rawDesc = row[headers.indexOf(mappings["description"])];
        const rawAmount = row[headers.indexOf(mappings["amount"])];
        const rawType = row[headers.indexOf(mappings["type"])];

        // Combine note and description
        const descriptionText = (rawNote ? String(rawNote).trim() : "") || (rawDesc ? String(rawDesc).trim() : "");

        // Skip row if basic data is missing
        if (!rawDate && !rawAmount) return;

        // Format Date (Excel handles dates as serial numbers sometimes)
        let parsedDate: Date;
        if (typeof rawDate === "number") {
          // Excel date serial number offset
          parsedDate = new Date((rawDate - 25569) * 86400 * 1000);
        } else if (rawDate) {
          parsedDate = new Date(rawDate);
        } else {
          parsedDate = new Date();
        }

        // Standardise transaction Type
        let transactionType = "Expense";
        if (rawType) {
          const typeStr = String(rawType).toLowerCase().trim();
          if (typeStr.includes("inc") || typeStr.includes("sal") || typeStr.includes("bonus") || typeStr.includes("inflow")) {
            transactionType = "Income";
          }
        } else if (rawCategory) {
          const catStr = String(rawCategory).toLowerCase().trim();
          if (catStr.includes("salary") || catStr.includes("bonus") || catStr.includes("income") || catStr.includes("unibot")) {
            transactionType = "Income";
          }
        }

        record.date = parsedDate.toISOString();
        record.category = rawCategory ? cleanCategory(String(rawCategory)) : "Others";
        record.description = descriptionText || "Imported Record";
        
        // Sanitize Amount
        let amtValue = 0;
        if (typeof rawAmount === "number") {
          amtValue = rawAmount;
        } else if (rawAmount) {
          amtValue = parseFloat(String(rawAmount).replace(/[^0-9.-]+/g, "")) || 0;
        }
        record.amount = Math.abs(amtValue); 
        record.type = transactionType;

        finalMapped.push(record);
      });

      setParsedRows(bodyRows);
      setMappedData(finalMapped);

      if (finalMapped.length === 0) {
        setError("Could not parse any valid transaction rows. Check headers mapping.");
      }

    } catch (err: any) {
      setError("Error parsing sheet details.");
      console.error(err);
    }
  };

  const handleImportSubmit = async () => {
    if (mappedData.length === 0) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/tracking/expenses/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: mappedData }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to import rows");
      }

      setSuccess(result.message || `Successfully imported ${result.importedCount} transactions.`);
      setMappedData([]);
      setParsedRows([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "Failed to process database write.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearDatabase = async () => {
    if (!confirm("⚠️ WARNING: This will permanently delete ALL recorded transactions for your user account so you can do a fresh, clean re-import. Are you absolutely sure?")) {
      return;
    }

    setClearing(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/tracking/expenses/import", {
        method: "DELETE",
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to clear database");
      }

      setSuccess(result.message || "Successfully cleared all transaction records.");
      setMappedData([]);
      setParsedRows([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "Failed to clear transactions.");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030308] flex flex-col justify-between">
      <div className="cyber-grid"></div>

      <div className="relative z-10 flex flex-col flex-grow">
        <Navigation />

        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-grow">
          {/* Back btn */}
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="text-xs text-slate-500 hover:text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-black uppercase tracking-widest text-slate-200">History Migration</h2>
            <p className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">Upload Money Manager Excel backups directly</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload form card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-card p-6 rounded-2xl border border-white/5">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-200 mb-6 flex items-center gap-2">
                  <FileUp size={14} className="text-indigo-400" />
                  <span>Select Backup File</span>
                </h3>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-red-400 text-xs font-medium">
                    ⚠️ {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                    ✅ {success}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Excel Upload Area */}
                  <div className="border border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center bg-white/[0.005] hover:bg-white/[0.015] hover:border-indigo-500/30 transition-all relative">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".xlsx,.xls"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={loading || parsing}
                    />
                    <FileUp size={24} className="text-slate-500 mb-2 animate-bounce" />
                    <span className="text-xs font-bold text-slate-400">Choose .xlsx file</span>
                    <span className="text-[10px] text-slate-600 mt-1 uppercase tracking-wider">Money Manager Excel Export</span>
                  </div>

                  {/* Sheet Selector */}
                  {sheetsList.length > 0 && (
                    <div className="space-y-1 mt-4">
                      <label className="text-[9px] uppercase font-bold tracking-widest text-indigo-400">Worksheet</label>
                      <select
                        value={selectedSheet}
                        onChange={handleSheetChange}
                        className="w-full bg-white/[0.02] border border-white/5 focus:border-indigo-500/50 rounded-xl py-2 px-3 text-xs text-slate-200 outline-none cursor-pointer"
                      >
                        {sheetsList.map((sheet) => (
                          <option key={sheet} value={sheet} className="bg-[#0c0c16]">
                            {sheet}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {mappedData.length > 0 && (
                    <button
                      onClick={handleImportSubmit}
                      disabled={loading}
                      className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-[10px] font-bold uppercase tracking-widest py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          <span>Importing {mappedData.length} entries...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={12} />
                          <span>Seed {mappedData.length} Records</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Map Information Panel */}
              {mappedData.length > 0 && (
                <div className="glass-card p-4 rounded-xl border border-white/5 text-[11px] text-slate-500 space-y-2">
                  <h4 className="font-bold text-slate-300 uppercase tracking-widest text-[9px] mb-2 flex items-center gap-1">
                    <HelpCircle size={12} className="text-indigo-400" />
                    <span>Headers Mapping Summary</span>
                  </h4>
                  <div className="flex justify-between">
                    <span>Date Target:</span>
                    <span className="font-mono text-slate-300">{headersMap["date"] || "None"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Category Target:</span>
                    <span className="font-mono text-slate-300">{headersMap["category"] || "None"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Note Target:</span>
                    <span className="font-mono text-slate-300">{headersMap["note"] || "None"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Description Target:</span>
                    <span className="font-mono text-slate-300">{headersMap["description"] || "None"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Target:</span>
                    <span className="font-mono text-slate-300">{headersMap["amount"] || "None"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type Target:</span>
                    <span className="font-mono text-slate-300">{headersMap["type"] || "Auto-Category"}</span>
                  </div>
                </div>
              )}

              {/* Clear Database Card */}
              <div className="glass-card p-6 rounded-2xl border border-red-500/10 bg-red-950/5 mt-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-red-400 mb-2 flex items-center gap-2">
                  <AlertTriangle size={14} />
                  <span>Database Reset</span>
                </h3>
                <p className="text-[10px] text-slate-500 leading-relaxed mb-4">
                  If you previously imported records incorrectly (e.g. they mapped to "Imported Record" or "Others"), you can wipe your transaction database clean here before re-importing.
                </p>
                <button
                  onClick={handleClearDatabase}
                  disabled={clearing || loading}
                  className="w-full bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 hover:border-red-500/40 text-red-400 text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  {clearing ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Clearing Database...</span>
                    </>
                  ) : (
                    <span>Clear Transaction History</span>
                  )}
                </button>
              </div>
            </div>

            {/* Mapped Data Preview Table */}
            <div className="lg:col-span-2">
              <div className="glass-card p-6 rounded-2xl border border-white/5 h-full flex flex-col min-h-[400px]">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-200 mb-6 flex items-center gap-2">
                  <Eye size={14} className="text-indigo-400" />
                  <span>Preview Data ({mappedData.length} records detected)</span>
                </h3>

                {parsing ? (
                  <div className="flex-grow flex flex-col items-center justify-center gap-2">
                    <Loader2 size={24} className="text-indigo-500 animate-spin" />
                    <span className="text-[10px] text-slate-500 font-mono">Parsing workbook sheets...</span>
                  </div>
                ) : mappedData.length === 0 ? (
                  <div className="flex-grow flex items-center justify-center text-center text-xs text-slate-600 italic">
                    Select an Excel file on the left side to preview transaction structures here.
                  </div>
                ) : (
                  <div className="flex-grow overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300 border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-[9px] uppercase tracking-widest text-slate-500 font-bold">
                          <th className="py-3 px-2">Type</th>
                          <th className="py-3 px-2">Date</th>
                          <th className="py-3 px-2">Category</th>
                          <th className="py-3 px-2">Description</th>
                          <th className="py-3 px-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mappedData.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                            <td className="py-3 px-2 font-mono">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                row.type === "Income"
                                  ? "bg-emerald-950/20 text-emerald-400 border border-emerald-500/10"
                                  : "bg-red-950/20 text-red-400 border border-red-500/10"
                              }`}>
                                {row.type}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-slate-500 font-mono">
                              {new Date(row.date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                            </td>
                            <td className="py-3 px-2 font-semibold text-slate-300">{row.category}</td>
                            <td className="py-3 px-2 text-slate-400">{row.description}</td>
                            <td className="py-3 px-2 text-right font-mono font-bold text-slate-200">
                              ₹{row.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {mappedData.length > 10 && (
                      <div className="text-center text-[10px] text-slate-600 italic mt-4 uppercase tracking-wider">
                        showing first 10 rows of {mappedData.length} records.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer className="relative z-10 w-full border-t border-white/5 py-4 text-center">
        <p className="text-[10px] uppercase tracking-widest text-slate-600">Personal Labs. Excel Seeder Agent</p>
      </footer>
    </div>
  );
}
