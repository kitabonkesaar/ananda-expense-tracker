/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth-context';
import { MapPin, Calendar, Clock, CreditCard, Wallet, Smartphone, Layers, Check, X, Download, FileSpreadsheet, FileText } from 'lucide-react';

function formatCurrency(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

function generateCSV(expenses: any[], getUserById: (id: string) => any, allTrips: any[]): string {
  const headers = ['Sl No', 'Description', 'Category', 'Sub Category', 'Amount', 'Payment Method', 'Submitted By', 'Date', 'Time', 'Bill Available', 'Trip', 'Location'];
  const rows = expenses.map((exp, idx) => {
    const creator = getUserById(exp.createdBy);
    const trip = allTrips.find(t => t._id === exp.tripId);
    const dt = new Date(exp.createdAt);
    return [
      idx + 1,
      `"${exp.description.replace(/"/g, '""')}"`,
      exp.category,
      exp.subCategory || '',
      exp.amount,
      exp.paymentMethod || 'Cash',
      creator?.name || 'Unknown',
      dt.toLocaleDateString(),
      dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      exp.imageUrl === 'verified' ? 'Yes' : 'No',
      trip?.name || 'Unknown',
      exp.location ? `${exp.location.lat.toFixed(4)}, ${exp.location.lng.toFixed(4)}` : '',
    ].join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

function generateExcelXML(expenses: any[], getUserById: (id: string) => any, allTrips: any[]): string {
  const headers = ['Sl No', 'Description', 'Category', 'Sub Category', 'Amount', 'Payment Method', 'Submitted By', 'Date', 'Time', 'Bill Available', 'Trip', 'Location'];
  
  let xml = '<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
  xml += '<Styles>\n';
  xml += '<Style ss:ID="header"><Font ss:Bold="1" ss:Size="11"/><Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/></Style>\n';
  xml += '<Style ss:ID="currency"><NumberFormat ss:Format="₹#,##0"/></Style>\n';
  xml += '</Styles>\n';
  xml += '<Worksheet ss:Name="Expense Ledger">\n<Table>\n';
  
  // Column widths
  const widths = [40, 200, 80, 80, 80, 80, 120, 80, 60, 60, 140, 120];
  widths.forEach(w => { xml += `<Column ss:Width="${w}"/>\n`; });
  
  // Header row
  xml += '<Row>\n';
  headers.forEach(h => { xml += `<Cell ss:StyleID="header"><Data ss:Type="String">${h}</Data></Cell>\n`; });
  xml += '</Row>\n';
  
  // Data rows
  expenses.forEach((exp, idx) => {
    const creator = getUserById(exp.createdBy);
    const trip = allTrips.find(t => t._id === exp.tripId);
    const dt = new Date(exp.createdAt);
    xml += '<Row>\n';
    xml += `<Cell><Data ss:Type="Number">${idx + 1}</Data></Cell>\n`;
    xml += `<Cell><Data ss:Type="String">${exp.description.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</Data></Cell>\n`;
    xml += `<Cell><Data ss:Type="String">${exp.category}</Data></Cell>\n`;
    xml += `<Cell><Data ss:Type="String">${exp.subCategory || ''}</Data></Cell>\n`;
    xml += `<Cell ss:StyleID="currency"><Data ss:Type="Number">${exp.amount}</Data></Cell>\n`;
    xml += `<Cell><Data ss:Type="String">${exp.paymentMethod || 'Cash'}</Data></Cell>\n`;
    xml += `<Cell><Data ss:Type="String">${creator?.name || 'Unknown'}</Data></Cell>\n`;
    xml += `<Cell><Data ss:Type="String">${dt.toLocaleDateString()}</Data></Cell>\n`;
    xml += `<Cell><Data ss:Type="String">${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Data></Cell>\n`;
    xml += `<Cell><Data ss:Type="String">${exp.imageUrl === 'verified' ? 'Yes' : 'No'}</Data></Cell>\n`;
    xml += `<Cell><Data ss:Type="String">${(trip?.name || 'Unknown').replace(/&/g, '&amp;')}</Data></Cell>\n`;
    xml += `<Cell><Data ss:Type="String">${exp.location ? `${exp.location.lat.toFixed(4)}, ${exp.location.lng.toFixed(4)}` : ''}</Data></Cell>\n`;
    xml += '</Row>\n';
  });
  
  xml += '</Table>\n</Worksheet>\n</Workbook>';
  return xml;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdminSpendings() {
  const { allUsers } = useAuth();
  const allExpenses = useQuery(api.expenses.list) ?? [];
  const allTrips = useQuery(api.trips.list) ?? [];
  const [showExportMenu, setShowExportMenu] = useState(false);

  const getUserByIdFn = (id: string) => allUsers.find(u => u._id === id);

  const expenses = [...allExpenses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleDownloadCSV = () => {
    const csv = generateCSV(expenses, getUserByIdFn, allTrips);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(csv, `expense_ledger_${timestamp}.csv`, 'text/csv;charset=utf-8;');
    setShowExportMenu(false);
  };

  const handleDownloadExcel = () => {
    const xml = generateExcelXML(expenses, getUserByIdFn, allTrips);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(xml, `expense_ledger_${timestamp}.xls`, 'application/vnd.ms-excel');
    setShowExportMenu(false);
  };

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Expense Ledger</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Comprehensive list of all submitted transactions across all trips.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Export Button */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 text-white hover:bg-orange-600 transition-all active:scale-95 shadow-sm shadow-orange-200"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 w-44 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={handleDownloadCSV}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-emerald-500" />
                    Download CSV
                  </button>
                  <button
                    onClick={handleDownloadExcel}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                    Download Excel
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="bg-slate-100 p-2 rounded-xl shadow-inner border border-slate-200/50 flex items-center gap-2 px-4 text-xs font-bold text-slate-600">
             Total: {expenses.length} Records
          </div>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl text-center border border-slate-100 shadow-sm">
          <p className="text-lg text-slate-800 font-bold mb-1">No Records Found</p>
          <p className="text-sm text-slate-500 font-semibold">Submitted expenses will appear here for audit.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-4 px-4 font-bold text-center w-12">Sl</th>
                  <th className="py-4 px-6 font-bold">Expense</th>
                  <th className="py-4 px-6 font-bold">Categories</th>
                  <th className="py-4 px-6 font-bold">Amount</th>
                  <th className="py-4 px-6 font-bold">Payment</th>
                  <th className="py-4 px-6 font-bold">Submitted By</th>
                  <th className="py-4 px-6 font-bold">Audit Meta</th>
                  <th className="py-4 px-6 font-bold text-center">Bill</th>
                  <th className="py-4 px-6 font-bold text-right">Trip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp, idx) => {
                  const creator = getUserByIdFn(exp.createdBy);
                  const hasBill = exp.imageUrl === 'verified';
                  const trip = allTrips.find(t => t._id === exp.tripId);
                  
                  return (
                    <tr key={exp._id} className="hover:bg-slate-50 transition-colors group">
                      
                      {/* Serial Number */}
                      <td className="py-4 px-4 text-center">
                         <span className="text-[12px] font-black text-slate-400 tabular-nums">{idx + 1}</span>
                      </td>

                      {/* Expense Description */}
                      <td className="py-4 px-6 max-w-[250px] whitespace-normal">
                        <div className="flex flex-col gap-0.5">
                           <p className="text-[13px] font-bold text-slate-800 leading-snug break-words">
                             {exp.description}
                           </p>
                           {exp.location && (
                              <span className="flex items-center text-[10px] font-bold text-slate-400 gap-0.5">
                                <MapPin className="w-3 h-3 text-rose-400" /> Tracked
                              </span>
                           )}
                        </div>
                      </td>

                      {/* Categories */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                           <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 py-0.5 px-1.5 rounded border border-slate-200 w-fit">
                             {exp.category}
                           </span>
                           {exp.subCategory && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                 <Layers className="w-3 h-3" /> {exp.subCategory}
                              </span>
                           )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-6">
                         <span className="text-sm font-black text-slate-900 tracking-tight">
                            {formatCurrency(exp.amount)}
                         </span>
                      </td>

                      {/* Payment Method */}
                      <td className="py-4 px-6">
                         <div className="flex items-center gap-1.5">
                            {exp.paymentMethod === 'Cash' && <Wallet className="w-3.5 h-3.5 text-amber-500" />}
                            {exp.paymentMethod === 'UPI' && <Smartphone className="w-3.5 h-3.5 text-indigo-500" />}
                            {exp.paymentMethod === 'Card' && <CreditCard className="w-3.5 h-3.5 text-emerald-500" />}
                            <span className="text-[12px] font-bold text-slate-600">{exp.paymentMethod || 'Cash'}</span>
                         </div>
                      </td>

                      {/* Submitted By */}
                      <td className="py-4 px-6">
                         <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                               <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${creator?.name}`} alt="Profile" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[12px] font-bold text-slate-700">{creator?.name}</span>
                         </div>
                      </td>

                      {/* Audit Meta */}
                      <td className="py-4 px-6">
                         <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                               <Calendar className="w-3.5 h-3.5 text-slate-400" /> {new Date(exp.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                               <Clock className="w-3.5 h-3.5 text-slate-300" /> {new Date(exp.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                         </div>
                      </td>

                      {/* Bill Status */}
                      <td className="py-4 px-6 text-center">
                         <div className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center border ${hasBill ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                            {hasBill ? <Check className="w-4 h-4" strokeWidth={3} /> : <X className="w-4 h-4" />}
                         </div>
                      </td>

                      {/* Trip */}
                      <td className="py-4 px-6 text-right">
                         <span className="inline-block text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full max-w-[150px] truncate" title={trip?.name}>
                            {trip?.name || 'Unknown'}
                         </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
