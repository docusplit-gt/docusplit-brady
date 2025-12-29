import React, { useState } from 'react';
import { FileSearch, FileSpreadsheet, FileText, Loader2, CheckCircle } from 'lucide-react';
import { renderPageToImage } from '../services/pdfService';
import { analyzeInvoicePage } from '../services/gemini';
import { Discrepancy } from '../types';

// @ts-ignore
const XLSX = window.XLSX;
// @ts-ignore
const pdfjsLib = window.pdfjsLib;

const ReconcileModule: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [hasRun, setHasRun] = useState(false);

  const processReconciliation = async () => {
    if (!pdfFile || !excelFile) return;
    setIsProcessing(true);
    setHasRun(false);
    setStatus('Leyendo Excel...');

    try {
      const excelBuffer = await excelFile.arrayBuffer();
      const workbook = XLSX.read(excelBuffer);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const excelData = XLSX.utils.sheet_to_json(firstSheet) as any[];
      
      const excelIds = new Set<string>();
      excelData.forEach(row => {
        const key = Object.keys(row).find(k => k.toLowerCase().replace(/\s/g, '') === 'pickticketno');
        if (key && row[key]) excelIds.add(String(row[key]).trim());
      });

      setStatus('Escaneando PDF...');
      const pdfBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
      const pdfIds = new Set<string>();

      for (let i = 1; i <= pdf.numPages; i++) {
        setStatus(`Página ${i}/${pdf.numPages}...`);
        const img = await renderPageToImage(pdf, i);
        const metadata = await analyzeInvoicePage(img);
        if (metadata.invoiceNo) pdfIds.add(metadata.invoiceNo.trim());
      }

      const results: Discrepancy[] = [];
      pdfIds.forEach(id => { if (!excelIds.has(id)) results.push({ id, type: 'MISSING_IN_EXCEL' }); });
      excelIds.forEach(id => { if (!pdfIds.has(id)) results.push({ id, type: 'MISSING_IN_PDF' }); });

      setDiscrepancies(results);
      setHasRun(true);
      setStatus('Audit completado.');
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass p-8 rounded-2xl border border-white/10">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white"><FileSearch className="text-[#f84827]" /> Conciliación Audit</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <label className="h-24 border-2 border-dashed border-white/10 rounded-xl flex items-center gap-4 px-6 cursor-pointer hover:bg-white/5">
            <input type="file" accept=".pdf" className="hidden" onChange={e => e.target.files && setPdfFile(e.target.files[0])} />
            <FileText className={pdfFile ? 'text-green-500' : 'text-slate-600'} />
            <span className="truncate">{pdfFile ? pdfFile.name : 'Subir PDF'}</span>
          </label>
          <label className="h-24 border-2 border-dashed border-white/10 rounded-xl flex items-center gap-4 px-6 cursor-pointer hover:bg-white/5">
            <input type="file" accept=".xlsx" className="hidden" onChange={e => e.target.files && setExcelFile(e.target.files[0])} />
            <FileSpreadsheet className={excelFile ? 'text-[#f84827]' : 'text-slate-600'} />
            <span className="truncate">{excelFile ? excelFile.name : 'Subir Excel Log'}</span>
          </label>
        </div>
        <button onClick={processReconciliation} disabled={!pdfFile || !excelFile || isProcessing} className="w-full py-4 rounded-xl font-bold bg-[#f84827] text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all">
          {isProcessing ? <Loader2 className="animate-spin" /> : <FileSearch className="w-5 h-5" />} Run Audit
        </button>
      </section>

      {hasRun && (
        <section className="glass p-8 rounded-2xl animate-in fade-in">
          {discrepancies.length === 0 ? (
            <div className="text-center p-8 text-green-400 font-bold"><CheckCircle className="mx-auto mb-2" /> ¡Sin discrepancias!</div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/5">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-900">
                  <tr><th className="p-4">Invoice ID</th><th className="p-4">Estado</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {discrepancies.map((d, i) => (
                    <tr key={i} className="hover:bg-white/5">
                      <td className="p-4 font-mono text-slate-300">{d.id}</td>
                      <td className="p-4 font-bold text-red-400">{d.type.replace(/_/g, ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default ReconcileModule;