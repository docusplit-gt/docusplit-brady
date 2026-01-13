
import React, { useState } from 'react';
import { Upload, FileText, Cloud, Loader2, AlertCircle, Scissors, Download, Archive, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { analyzeInvoicePage } from '../services/gemini';
import { renderPageToImage, splitPdfIntoGroups } from '../services/pdfService';
import { initDriveAuth, uploadToDrive, findFolderByName, createFolder } from '../services/driveService';
import { Settings } from '../types';

// @ts-ignore
const pdfjsLib = window.pdfjsLib;
// @ts-ignore
const JSZip = window.JSZip;

interface SplitModuleProps {
  settings: Settings;
}

interface ResultFile {
  name: string;
  blob: Blob;
  shipTo: string;
  invoiceNo: string;
}

const SplitModule: React.FC<SplitModuleProps> = ({ settings }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [resultFiles, setResultFiles] = useState<ResultFile[]>([]);
  const [isUploaded, setIsUploaded] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const sanitize = (text: string) => text.replace(/[^a-z0-9]/gi, '_').substring(0, 50);

  const processFile = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setStatus('Starting scan...');
    setResultFiles([]);
    setIsUploaded(false);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      
      const invoiceGroups: { id: string; shipTo: string; pages: number[] }[] = [];
      let currentGroup: { id: string; shipTo: string; pages: number[] } | null = null;

      for (let i = 1; i <= totalPages; i++) {
        setStatus(`Analyzing page ${i} of ${totalPages}...`);
        const img = await renderPageToImage(pdf, i);
        
        const metadata = await analyzeInvoicePage(img, 3, (attempt) => {
          setStatus(`Quota reached. Retry ${attempt} for page ${i}...`);
        });
        
        const invoiceNo = metadata.invoiceNo || 'N-A';
        const shipTo = metadata.shipTo || 'Unknown_Client';

        if (metadata.invoiceNo && (!currentGroup || currentGroup.id !== metadata.invoiceNo)) {
          currentGroup = { id: metadata.invoiceNo, shipTo: shipTo, pages: [i] };
          invoiceGroups.push(currentGroup);
        } else if (currentGroup) {
          currentGroup.pages.push(i);
        } else {
          currentGroup = { id: invoiceNo, shipTo: shipTo, pages: [i] };
          invoiceGroups.push(currentGroup);
        }
        
        setProgress(Math.round((i / totalPages) * 100));
        
        if (i < totalPages) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }

      setStatus('Generating individual files...');
      const blobs = await splitPdfIntoGroups(file, invoiceGroups.map(g => g.pages));
      const results = blobs.map((blob, idx) => {
        const group = invoiceGroups[idx];
        return {
          name: `${sanitize(group.shipTo)}_${sanitize(group.id)}.pdf`,
          blob: blob,
          shipTo: group.shipTo,
          invoiceNo: group.id
        };
      });
      
      setResultFiles(results);
      setStatus('Split process ready.');
    } catch (error: any) {
      console.error(error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAsZip = async () => {
    if (resultFiles.length === 0) return;
    
    const zip = new JSZip();
    resultFiles.forEach(f => {
      zip.file(f.name, f.blob);
    });
    
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Audit_Split_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const uploadToGoogleDrive = async () => {
    if (!settings.driveClientId) return alert("Configuration error: Drive Client ID not found.");
    if (isUploaded) return;

    try {
      setStatus('Requesting Google Drive access...');
      const token = await initDriveAuth(settings.driveClientId);
      setIsProcessing(true);
      const folderCache: Record<string, string> = {};
      let uploadedCount = 0;

      for (const f of resultFiles) {
        const clientName = f.shipTo || 'Unknown_Client';
        let targetFolderId = settings.driveFolderId;

        if (!folderCache[clientName]) {
          let folderId = await findFolderByName(token, clientName, settings.driveFolderId);
          if (!folderId) {
            folderId = await createFolder(token, clientName, settings.driveFolderId);
          }
          folderCache[clientName] = folderId;
        }
        targetFolderId = folderCache[clientName];

        setStatus(`Uploading invoice ${f.invoiceNo} (${++uploadedCount}/${resultFiles.length})...`);
        await uploadToDrive({
          accessToken: token,
          name: f.name,
          blob: f.blob,
          parentId: targetFolderId || undefined
        });
      }
      setStatus('Success! Drive updated.');
      setIsUploaded(true);
    } catch (err: any) {
      console.error(err);
      setStatus(`Upload error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {settings.driveClientId && (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full w-fit mx-auto md:mx-0">
          <ShieldCheck className="w-3 h-3 text-green-400" />
          <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Active</span>
        </div>
      )}

      <section className="glass p-8 rounded-2xl border border-white/10">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
          <Upload className="text-[#f84827]" />
          Intelligent Splitter
        </h2>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <label className="flex-1 w-full h-32 border-2 border-dashed border-white/20 rounded-xl hover:border-[#f84827]/50 transition-colors flex flex-col items-center justify-center cursor-pointer bg-white/5">
            <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
            <FileText className="w-8 h-8 text-slate-500 mb-2" />
            <span className="text-sm font-medium">{file ? file.name : "Select Master PDF"}</span>
          </label>
          <button
            onClick={processFile}
            disabled={!file || isProcessing}
            className="w-full md:w-auto h-32 px-12 rounded-xl font-bold bg-[#f84827] text-white flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-8 h-8 animate-spin" /> : <Scissors className="w-8 h-8 mb-2" />}
            {isProcessing ? "Processing..." : "Start Split"}
          </button>
        </div>

        {isProcessing && (
          <div className="mt-8 space-y-2">
            <div className="flex justify-between text-xs text-[#f84827]">
              <span className="flex items-center gap-2">
                {status.includes('Quota') && <Clock className="w-3 h-3 animate-pulse" />}
                {status}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-[#f84827] h-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </section>

      {resultFiles.length > 0 && !isProcessing && (
        <section className="glass p-8 rounded-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-4">
          {isUploaded && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-400 animate-in zoom-in-95 duration-300">
              <CheckCircle2 className="w-5 h-5" />
              <div className="text-sm font-medium">Files successfully synchronized with Google Drive folders.</div>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold">Audit List</h3>
              <p className="text-slate-400">{resultFiles.length} invoices split.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={downloadAsZip}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 rounded-lg font-bold hover:bg-white/20 transition-all border border-white/10"
              >
                <Archive className="w-4 h-4" />
                Download ZIP
              </button>
              <button 
                onClick={uploadToGoogleDrive}
                disabled={isUploaded}
                className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold transition-all shadow-lg ${
                  isUploaded 
                    ? 'bg-green-600 cursor-default opacity-90' 
                    : 'bg-[#f84827] hover:scale-105 shadow-[#f84827]/20 active:scale-95'
                }`}
              >
                {isUploaded ? <ShieldCheck className="w-4 h-4" /> : <Cloud className="w-4 h-4" />}
                {isUploaded ? 'Saved to Drive' : 'Upload to Drive'}
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto custom-scrollbar rounded-lg border border-white/5">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 sticky top-0">
                <tr>
                  <th className="p-4 font-bold">Client / File</th>
                  <th className="p-4 font-bold text-right">Size</th>
                  <th className="p-4 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {resultFiles.map((f, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="text-[#f84827] text-[10px] font-bold uppercase mb-1">{f.shipTo}</div>
                      <div className="text-slate-200">{f.name}</div>
                    </td>
                    <td className="p-4 text-right text-slate-500">{(f.blob.size / 1024).toFixed(1)} KB</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => {
                          const url = URL.createObjectURL(f.blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = f.name;
                          link.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="p-2 hover:bg-[#f84827]/10 rounded-lg text-[#f84827] transition-colors"
                        title="Download individual"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {status.includes('Error') && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{status}</span>
        </div>
      )}
    </div>
  );
};

export default SplitModule;
