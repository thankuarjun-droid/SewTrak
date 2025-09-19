import React from 'react';
import type { FactorySettings } from '../types';
// FIX: Remove dummy icon components and import them from IconComponents
import { SewTrakIcon, TrophyIcon, PrinterIcon, CertificateFrame, LaurelBranchIcon, AwardIcon, CoinIcon } from '../components/IconComponents';

interface CertificateTemplatePageProps {
  factorySettings: FactorySettings;
}

const OfficialSealIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="50" cy="50" r="48" fill="#fef9c3" stroke="#ca8a04" strokeWidth="2"/>
        <circle cx="50" cy="50" r="42" fill="none" stroke="#ca8a04" strokeWidth="1" strokeDasharray="5,3"/>
        <text x="50" y="32" fontFamily="serif" fontSize="8" textAnchor="middle" fill="#854d0e" letterSpacing="0.5">AWARD OF EXCELLENCE</text>
        <path d="M50 38 L42 50 L50 62 L58 50 Z" fill="#ca8a04"/>
        <text x="50" y="75" fontFamily="serif" fontSize="8" textAnchor="middle" fill="#854d0e" letterSpacing="0.5">NAVIGATOR 1.0</text>
    </svg>
);

const CertificateTemplatePage = ({ factorySettings }: CertificateTemplatePageProps) => {
  const { name: orgName, logoBase64 } = factorySettings?.organizationDetails || {};

  const handlePrint = () => {
    window.print();
  };

  const printStyles = `
    @media print {
      body * {
        visibility: hidden;
      }
      #certificate-wrapper, #certificate-wrapper * {
        visibility: visible;
      }
      #certificate-wrapper {
        position: absolute;
        left: 0;
        top: 0;
        width: 100vw;
        height: 100vh;
        margin: 0;
        padding: 0;
      }
      @page {
        size: A4 landscape;
        margin: 0;
      }
    }
  `;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@400;500;600&display=swap');
        ${printStyles}
      `}</style>
      <div className="p-4 sm:p-6 md:p-10 bg-slate-100 dark:bg-slate-900 print:bg-white print:p-0">
        <header className="flex justify-between items-center mb-8 print:hidden">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Certificate Template</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">This is a preview of the certificate that will be printed for winners.</p>
          </div>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-700">
            <PrinterIcon className="w-5 h-5" />
            Print Preview
          </button>
        </header>

        {/* This div is what will be printed */}
        <div id="certificate-wrapper" className="max-w-4xl mx-auto aspect-[297/210] bg-[#fdfdfc] shadow-2xl print:max-w-none print:shadow-none print:mx-0">
           <div className="w-full h-full relative flex flex-col items-center text-center p-12" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                <CertificateFrame />

                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center z-0">
                    <SewTrakIcon className="w-96 h-96 text-slate-100/80" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center w-full h-full">
                    {logoBase64 && <img src={logoBase64} alt="Organization Logo" className="h-16 mb-2"/>}
                    <h1 className="text-2xl font-semibold text-slate-700 tracking-[0.2em]">{orgName?.toUpperCase()}</h1>
                    
                    <div className="flex items-center justify-center gap-4 text-[#ca8a04] my-6">
                        <LaurelBranchIcon className="w-12 h-12 transform scale-x-[-1]"/>
                        <p className="text-lg tracking-widest text-slate-500">CERTIFICATE OF ACHIEVEMENT</p>
                        <LaurelBranchIcon className="w-12 h-12"/>
                    </div>

                    <p className="text-md text-slate-500 mt-2">PROUDLY PRESENTED TO</p>
                    
                    <div className="flex items-center justify-center gap-4 mt-2">
                        <TrophyIcon className="w-12 h-12 text-[#ca8a04]" />
                        <h2 className="text-6xl text-[#2c4e8a] tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>[Winner's Name]</h2>
                    </div>
                    <p className="text-md text-slate-600 mt-1">[Winner's Designation]</p>
                    
                    <p className="text-lg text-slate-500 mt-6 max-w-2xl">for outstanding performance and dedication, achieving the prestigious title of</p>
                    <h3 className="text-3xl font-semibold text-slate-800 mt-2">[Award Title]</h3>
                    
                    <div className="flex justify-center items-center gap-12 mt-6 text-slate-700">
                        <div className="flex items-center gap-3">
                            <AwardIcon className="w-10 h-10 text-slate-500" />
                            <div>
                                <p className="text-sm text-slate-500 tracking-widest text-left">LEVEL</p>
                                <p className="text-3xl font-bold text-left">[Lvl]</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <CoinIcon className="w-10 h-10 text-slate-500" />
                            <div>
                                <p className="text-sm text-slate-500 tracking-widest text-left">POINTS</p>
                                <p className="text-3xl font-bold text-left">[Points]</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto flex justify-between items-center w-full max-w-2xl pt-4">
                        <div className="text-center w-1/3">
                            <p className="border-t-2 border-slate-400 pt-2 font-semibold text-sm">MANAGER</p>
                        </div>
                         <div className="w-1/3 flex justify-center">
                            <OfficialSealIcon className="w-24 h-24"/>
                        </div>
                        <div className="text-center w-1/3">
                            <p className="border-t-2 border-slate-400 pt-2 font-semibold text-sm">DIRECTOR</p>
                        </div>
                    </div>
                </div>
           </div>
        </div>
      </div>
    </>
  );
};

export default CertificateTemplatePage;