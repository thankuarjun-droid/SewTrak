
import type { SVGProps } from 'react';

export const SewTrakLogo = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 550 100" {...props}>
        <g>
            <circle cx="50" cy="50" r="50" fill="#2c4e8a" />
            <g transform="rotate(135 70 30)">
                <path d="M 70 10 L 68 50 L 72 50 Z" fill="#FFF" />
                <circle cx="70" cy="20" r="2" fill="#2c4e8a" />
            </g>
            <path d="M20 70 L40 50 L60 60 L80 40" stroke="#f7a93b" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <text x="120" y="55" fill="#2c4e8a" style={{fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: "40px", fontWeight: "bold"}}>
            SewTrak
        </text>
        <text x="120" y="80" fill="#f7a93b" style={{fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: "16px", fontWeight: "600"}}>
            Garment Hourly Production Tracker
        </text>
    </svg>
);

export const SewTrakIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" {...props}>
        <circle cx="50" cy="50" r="50" fill="currentColor" />
        <g transform="rotate(135 70 30)">
            <path d="M 70 10 L 68 50 L 72 50 Z" fill="#FFF" />
            <circle cx="70" cy="20" r="2" fill="currentColor" />
        </g>
        <path d="M20 70 L40 50 L60 60 L80 40" stroke="#f7a93b" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


export const SparkleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" />
  </svg>
);

export const ClockIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        {...props}
    >
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

export const PlusIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        {...props}
    >
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

export const XIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        {...props}
    >
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

export const HomeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
    <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
  </svg>
);

export const ClipboardIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10.5 3A2.5 2.5 0 008 5.5v1.25a.75.75 0 01-1.5 0V5.5A4 4 0 0110.5 1.5h3A4 4 0 0117.5 5.5v1.25a.75.75 0 01-1.5 0V5.5A2.5 2.5 0 0013.5 3h-3z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M6.112 6.33a.75.75 0 01.75-.75h10.276a.75.75 0 01.75.75v10.843a.75.75 0 01-.153.444.75.75 0 01-.6.303H6.865a.75.75 0 01-.6-.303.75.75 0 01-.153-.444V6.33zM4.612 6.33A2.25 2.25 0 016.865 4.83h10.276A2.25 2.25 0 0119.39 7.08v9.39a2.25 2.25 0 01-2.25 2.25H6.865a2.25 2.25 0 01-2.25-2.25v-9.39a2.25 2.25 0 01-.003-1.53z" clipRule="evenodd" />
    <path d="M10.875 10.313a.75.75 0 00-1.06 1.062l1.69 1.69-1.69 1.69a.75.75 0 101.06 1.062l1.69-1.69 1.69 1.69a.75.75 0 101.06-1.062l-1.69-1.69 1.69-1.69a.75.75 0 00-1.06-1.062l-1.69 1.69-1.69-1.69z" />
  </svg>
);

export const ClipboardListIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M10.5 1.5H8.625a2.25 2.25 0 00-2.25 2.25v16.5A2.25 2.25 0 008.625 22.5h6.75a2.25 2.25 0 002.25-2.25V3.75A2.25 2.25 0 0015.375 1.5H13.5v1.125c0 .621-.504 1.125-1.125 1.125h-1.5C10.254 3.75 9.75 3.246 9.75 2.625V1.5h.75z" />
    <path d="M18.375 3h.875a2.25 2.25 0 012.25 2.25v13.5a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25V5.25a2.25 2.25 0 012.25-2.25h.875v1.125c0 .621.504 1.125 1.125 1.125h1.5c.621 0 1.125-.504 1.125-1.125V3h.75v1.125c0 .621.504 1.125 1.125 1.125h1.5c.621 0 1.125-.504 1.125-1.125V3zM10.5 8.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3zm0 3a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3zm0 3a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" />
  </svg>
);

export const UsersIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM2.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.533 1.483 12.741 12.741 0 01-6.44 3.033A12.741 12.741 0 013.806 20.755a2.25 2.25 0 01-.533-1.483l-.001-.144a5.625 5.625 0 0111.25 0z" />
  </svg>
);

export const UserIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
  </svg>
);

export const WrenchIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0L2.22 11.252a.75.75 0 00.516 1.288l3.696.069-.53 2.517a.75.75 0 00.672.918l3.696-.07.53 2.517a.75.75 0 00.672.918l3.696-.07-.53 2.517a.75.75 0 00.672.918l3.696-.07a.75.75 0 00.516-1.288L12.516 2.17zM11.94 13.033a.75.75 0 00-1.032.052l-.53 2.517.53-2.517a.75.75 0 00-1.032-.052l-.53 2.517.53-2.517a.75.75 0 00-1.032-.052l-1.06 5.034 8.793-1.772.53-2.517a.75.75 0 00-.672-.918l-3.696.07-.53-2.517a.75.75 0 00-.672-.918l-3.696.07.53-2.517a.75.75 0 00-.672-.918l-3.696.07.53-2.517a.75.75 0 00-.672-.918l-1.06 5.034 8.793-1.772z" clipRule="evenodd" />
  </svg>
);

export const TagIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M9.375 3a1.875 1.875 0 000 3.75h1.875v4.5H3.375A1.875 1.875 0 011.5 9.375v-.75c0-1.036.84-1.875 1.875-1.875h1.5V6a.75.75 0 01.75-.75h7.5a.75.75 0 01.75.75v1.5h1.5A1.875 1.875 0 0118 9.375v.75a1.875 1.875 0 01-1.875 1.875h-7.875v4.5h1.875a1.875 1.875 0 100-3.75H9.375z" />
    <path fillRule="evenodd" d="M21.566 14.532a.75.75 0 01-.005 1.06l-4.5 4.5a.75.75 0 01-1.06-1.06l4.5-4.5a.75.75 0 011.065.005z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M16.495 20.101a.75.75 0 01-1.06-1.06l4.5-4.5a.75.75 0 011.06 1.06l-4.5 4.5z" clipRule="evenodd" />
  </svg>
);

export const PaletteIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.012 2.25c4.14 0 7.51 3.37 7.51 7.51 0 1.962-.758 3.758-1.992 5.08a.33.33 0 00-.02.032l-5.45 6.47a.75.75 0 01-1.1 0l-5.45-6.47a.332.332 0 00-.02-.032A7.51 7.51 0 0112.012 2.25zM12.012 3.75a6.01 6.01 0 00-5.833 4.903.75.75 0 11-1.482-.206 7.51 7.51 0 0114.63 0 .75.75 0 11-1.482.205A6.01 6.01 0 0012.012 3.75z" />
    <path d="M8.26 8.625a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75z" />
  </svg>
);

export const BuildingOfficeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M4.5 2.25a.75.75 0 000 1.5v16.5a.75.75 0 00.75.75h13.5a.75.75 0 00.75-.75V3.75a.75.75 0 000-1.5h-15a.75.75 0 00-.75.75zM9 4.5a.75.75 0 000 1.5h.75a.75.75 0 000-1.5H9zM8.25 9a.75.75 0 01.75-.75h.75a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75zM9 12.75a.75.75 0 000 1.5h.75a.75.75 0 000-1.5H9zM8.25 17.25a.75.75 0 01.75-.75h.75a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75zM12.75 4.5a.75.75 0 000 1.5h.75a.75.75 0 000-1.5h-.75zM12 9a.75.75 0 01.75-.75h.75a.75.75 0 010 1.5h-.75A.75.75 0 0112 9zM12.75 12.75a.75.75 0 000 1.5h.75a.75.75 0 000-1.5h-.75zM12 17.25a.75.75 0 01.75-.75h.75a.75.75 0 010 1.5h-.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
  </svg>
);

export const MenuIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 01-.75-.75z" clipRule="evenodd" />
  </svg>
);

export const ChartBarIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M3 13.5A1.5 1.5 0 014.5 12h1.5a1.5 1.5 0 011.5 1.5v6A1.5 1.5 0 016 21H4.5A1.5 1.5 0 013 19.5v-6zM9.75 8.25A1.5 1.5 0 0111.25 6.75h1.5a1.5 1.5 0 011.5 1.5v11.25A1.5 1.5 0 0112.75 21h-1.5a1.5 1.5 0 01-1.5-1.5V8.25zM16.5 3A1.5 1.5 0 0118 1.5h1.5a1.5 1.5 0 011.5 1.5v16.5A1.5 1.5 0 0119.5 21h-1.5a1.5 1.5 0 01-1.5-1.5V3z" />
    </svg>
);

export const PencilIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
        <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25-1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
    </svg>
);

export const TrashIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.237-2.37.465a.75.75 0 00-.5.858l.318 1.161c.54.198 1.09.32 1.652.385V13.75A2.75 2.75 0 008.75 16.5h2.5A2.75 2.75 0 0014 13.75V6.702c.562-.065 1.112-.187 1.652-.385l.318-1.161a.75.75 0 00-.5-.858A11.94 11.94 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V13.75c0 .69-.56 1.25-1.25 1.25h-2.5c-.69 0-1.25-.56-1.25-1.25V4.075C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.84 0a.75.75 0 01-1.499.06l-.3 7.5a.75.75 0 111.499-.06l.3-7.5z" clipRule="evenodd" />
    </svg>
);

export const CogIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0l-.12.48a1.75 1.75 0 01-2.09.94l-.46-.17a1.75 1.75 0 00-1.99 1.05l-.23.47a1.75 1.75 0 00.52 2.13l.39.31a1.75 1.75 0 010 2.44l-.39.31a1.75 1.75 0 00-.52 2.13l.23.47a1.75 1.75 0 001.99 1.05l.46-.17a1.75 1.75 0 012.09.94l.12.48c.38 1.56 2.6 1.56 2.98 0l.12-.48a1.75 1.75 0 012.09-.94l.46.17a1.75 1.75 0 001.99-1.05l.23-.47a1.75 1.75 0 00-.52-2.13l-.39-.31a1.75 1.75 0 010-2.44l.39-.31a1.75 1.75 0 00.52-2.13l.23-.47a1.75 1.75 0 00-1.99-1.05l.46.17a1.75 1.75 0 012.09-.94l.12.48zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
);

export const BoltIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.14z" clipRule="evenodd" />
    </svg>
);

export const TruckIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25zM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 116.25 0h1.75a3 3 0 116.25 0h.375a1.875 1.875 0 001.875-1.875V15h-6.75z" />
        <path fillRule="evenodd" d="M15 4.5a.75.75 0 01.75.75v9.75a.75.75 0 01-1.5 0V5.25a.75.75 0 01.75-.75z" clipRule="evenodd" />
    </svg>
);

export const DocumentTextIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M3.75 3A1.5 1.5 0 002.25 4.5v15A1.5 1.5 0 003.75 21h16.5A1.5 1.5 0 0021.75 19.5V4.5A1.5 1.5 0 0020.25 3H3.75zM8.25 9a.75.75 0 000 1.5h7.5a.75.75 0 000-1.5h-7.5zm0 3a.75.75 0 000 1.5h7.5a.75.75 0 000-1.5h-7.5zm0 3a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z" clipRule="evenodd" />
    </svg>
);

export const DocumentCheckIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
);


export const ClipboardCheckIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10.5 3A2.5 2.5 0 008 5.5v1.25a.75.75 0 01-1.5 0V5.5A4 4 0 0110.5 1.5h3A4 4 0 0117.5 5.5v1.25a.75.75 0 01-1.5 0V5.5A2.5 2.5 0 0013.5 3h-3z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M6.112 6.33a.75.75 0 01.75-.75h10.276a.75.75 0 01.75.75v10.843a.75.75 0 01-.153.444.75.75 0 01-.6.303H6.865a.75.75 0 01-.6-.303.75.75 0 01-.153-.444V6.33zM4.612 6.33A2.25 2.25 0 016.865 4.83h10.276A2.25 2.25 0 0119.39 7.08v9.39a2.25 2.25 0 01-2.25 2.25H6.865a2.25 2.25 0 01-2.25-2.25v-9.39a2.25 2.25 0 01-.003-1.53z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M10.03 11.72a.75.75 0 011.06 0l1.5 1.5a.75.75 0 11-1.06 1.06l-1.5-1.5a.75.75 0 010-1.06z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M11.09 11.72a.75.75 0 00-1.06 0l-1.5 1.5a.75.75 0 001.06 1.06l1.5-1.5a.75.75 0 000-1.06z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M13.22 14.78a.75.75 0 011.06 0l1.5 1.5a.75.75 0 11-1.06 1.06l-1.5-1.5a.75.75 0 010-1.06z" clipRule="evenodd" />
  </svg>
);

export const CalendarDaysIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 2.25a.75.75 0 01.75.75v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3h.75V3a.75.75 0 01.75-.75zM5.25 6.75c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h13.5c.621 0 1.125-.504 1.125-1.125V7.875c0-.621-.504-1.125-1.125-1.125H5.25z" clipRule="evenodd" />
    </svg>
);

export const ChartPieIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M10.5 3.75a.75.75 0 00-1.5 0v6.75h6.75a.75.75 0 000-1.5h-5.25V3.75z" />
        <path fillRule="evenodd" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0-1.5a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" clipRule="evenodd" />
    </svg>
);

export const ArrowUpIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.99 9.27a.75.75 0 01-1.06-1.06l4.25-4.25a.75.75 0 011.06 0l4.25 4.25a.75.75 0 01-1.06 1.06L10.75 5.612V16.25a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
);

export const ArrowDownIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.28-3.288a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0l-4.25-4.25a.75.75 0 111.06-1.06L9.25 14.388V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
    </svg>
);

export const CurrencyRupeeIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12.93 1.002a1.04 1.04 0 00-1.012.062l-7.25 4.5A1 1 0 004 6.5v.003c0 .524.403.955.922.996l7.25 1.208a.998.998 0 00.856-.145L18 5.5l-5.07-4.498z" />
        <path d="M12.93 10.002a1.04 1.04 0 00-1.012.062l-7.25 4.5A1 1 0 004 15.5v.003c0 .524.403.955.922.996l7.25 1.208a.998.998 0 00.856-.145L18 14.5l-5.07-4.498z" />
        <path d="M20 12a1 1 0 00-1-1h-1.5a1 1 0 00-1 1v.003a1 1 0 001 1h1.5a1 1 0 001-1v-.003z" />
        <path d="M14.078 19.33a1 1 0 00.856-.145l7.25-4.5a1 1 0 00.078-1.688l-7.25-4.5a1 1 0 00-1.012.062L8 12.06v5.44l6.078 1.83z" />
    </svg>
);

export const UsersGroupIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM2.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.533 1.483 12.741 12.741 0 01-6.44 3.033A12.741 12.741 0 013.806 20.755a2.25 2.25 0 01-.533-1.483l-.001-.144a5.625 5.625 0 0111.25 0z" />
    </svg>
);

export const AdjustmentsHorizontalIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="4" y1="21" x2="4" y2="14"></line>
      <line x1="4" y1="10" x2="4" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12" y2="3"></line>
      <line x1="20" y1="21" x2="20" y2="16"></line>
      <line x1="20" y1="12" x2="20" y2="3"></line>
      <line x1="1" y1="14" x2="7" y2="14"></line>
      <line x1="9" y1="8" x2="15" y2="8"></line>
      <line x1="17" y1="16" x2="23" y2="16"></line>
    </svg>
);

export const ShieldCheckIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M12 2.25c.534 0 1.054.06 1.562.176a.75.75 0 01.32 1.282A11.16 11.16 0 0012 5.25a11.16 11.16 0 00-1.882-1.542.75.75 0 01.32-1.282A12.036 12.036 0 0112 2.25zM10.16 4.932a9.658 9.658 0 013.68 0L12 6.428l-1.84-1.496zM19.5 7.5c0 4.962-3.447 9.45-8.25 11.108a.75.75 0 01-.66 0C5.947 16.95 2.5 12.462 2.5 7.5L2.25 7.5a.75.75 0 01.75-.75h18a.75.75 0 01.75.75L21.5 7.5zM16.06 10.94a.75.75 0 00-1.06-1.06l-4.72 4.72-1.72-1.72a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l5.25-5.25z" clipRule="evenodd" />
    </svg>
);

export const ArrowLeftOnRectangleIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h10.94l-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
);

export const ChatBubbleLeftRightIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.75 6.75 0 006.75-6.75v-2.5a.75.75 0 011.5 0v2.5a8.25 8.25 0 01-8.25 8.25c-1.297 0-2.54-.3-3.696-.856l-.043-.021c-.014-.007-.028-.014-.042-.021a4.013 4.013 0 01-1.6-2.035c-.146-.374-.168-.767-.168-1.162v-2.5a.75.75 0 011.5 0v2.5c0 .338.018.671.053.998a2.513 2.513 0 001.034 1.285l.043.021.042.021zM10.875 1.5a.75.75 0 01.75.75v3.252c0 .495.321.942.784 1.139a2.5 2.5 0 002.568-.737c.532-.532.823-1.24.823-1.998V1.5a.75.75 0 011.5 0v3.155c0 .918-.363 1.78-1.006 2.424a4.012 4.012 0 01-4.06 1.139.75.75 0 01-1.14-1.14 2.512 2.512 0 001.076-4.139A.75.75 0 0110.875 1.5z" clipRule="evenodd" />
      <path d="M10.5 12.75a.75.75 0 00-1.5 0v2.5c0 1.445-.494 2.82-1.353 3.866a.75.75 0 001.216.884A4.013 4.013 0 0012 18.75a.75.75 0 00.75-.75v-2.5a.75.75 0 011.5 0v2.5a2.25 2.25 0 01-2.25 2.25c-.63 0-1.235-.198-1.756-.554a.75.75 0 00-1.216.884A6.728 6.728 0 009 21.75a6.75 6.75 0 006.75-6.75v-2.5a.75.75 0 00-1.5 0v2.5a.75.75 0 01-1.5 0v-2.5a2.25 2.25 0 00-2.25-2.25H1.5a.75.75 0 000 1.5h7.5a.75.75 0 01.75.75v2.5a.75.75 0 001.5 0v-2.5a.75.75 0 00-.75-.75H1.5a2.25 2.25 0 01-2.25-2.25v-2.5A2.25 2.25 0 011.5 7.5h7.5a.75.75 0 000-1.5H1.5A3.75 3.75 0 00-2.25 10v2.5A3.75 3.75 0 001.5 16.25h7.5a2.25 2.25 0 002.25-2.25v-1.25z" />
    </svg>
);

// FIX: Added missing BellIcon component
export const BellIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
);

export const PaperAirplaneIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

export const PlayIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.748 1.295 2.538 0 3.286L7.279 20.99c-1.25.72-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
    </svg>
);

export const PauseIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 00-.75.75v12a.75.75 0 001.5 0V6a.75.75 0 00-.75-.75zm9 0a.75.75 0 00-.75.75v12a.75.75 0 001.5 0V6a.75.75 0 00-.75-.75z" clipRule="evenodd" />
    </svg>
);

export const ArrowLeftIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
    </svg>
);

export const ArrowRightIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z" clipRule="evenodd" />
    </svg>
);

export const CheckCircleIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
);

export const XCircleIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
);

export const ExclamationTriangleIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5a.75.75 0 001.5 0v-5zM10 14a.75.75 0 110-1.5.75.75 0 010 1.5z" clipRule="evenodd" />
    </svg>
);

export const TrophyIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M13.26 3.427a2.25 2.25 0 013.48 0l1.121 1.121a2.25 2.25 0 001.591.659h1.583a2.25 2.25 0 012.25 2.25v1.583c0 .597.234 1.17.659 1.59l1.121 1.121a2.25 2.25 0 010 3.48l-1.121 1.121a2.25 2.25 0 00-.659 1.591v1.583a2.25 2.25 0 01-2.25 2.25h-1.583a2.25 2.25 0 00-1.591.659l-1.121 1.121a2.25 2.25 0 01-3.48 0l-1.121-1.121a2.25 2.25 0 00-1.591-.659H7.333a2.25 2.25 0 01-2.25-2.25v-1.583a2.25 2.25 0 00-.659-1.591L3.423 16.74a2.25 2.25 0 010-3.48l1.121-1.121a2.25 2.25 0 00.659-1.591V8.966a2.25 2.25 0 012.25-2.25h1.583a2.25 2.25 0 001.591-.659L13.26 3.427zm-2.213.627a.75.75 0 01-1.06 0L8.866 5.176a3.75 3.75 0 00-2.652 1.09l-1.121 1.121a3.75 3.75 0 00-1.09 2.652v1.583a3.75 3.75 0 001.09 2.652l1.121 1.121a3.75 3.75 0 002.652 1.09h1.583a3.75 3.75 0 002.652-1.09l1.121-1.121a3.75 3.75 0 001.09-2.652v-1.583a3.75 3.75 0 00-1.09-2.652l-1.121-1.121a3.75 3.75 0 00-2.652-1.09l-1.121-1.121z" clipRule="evenodd" />
    </svg>
);

// FIX: Added missing icons
export const StarIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
);

export const PrinterIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M7.875 1.5C6.839 1.5 6 2.34 6 3.375v2.99c-.426.053-.85.17-1.274.341a.75.75 0 00-.488.653v1.498c0 .266.105.52.293.707l.091.091c.181.181.422.28.675.281h13.125c.253 0 .494-.1.675-.281l.091-.091a.75.75 0 00.293-.707V7.36c0-.311-.201-.585-.488-.653a41.02 41.02 0 00-1.274-.341V3.375C18 2.34 17.161 1.5 16.125 1.5H7.875zM6 12.75a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75a.75.75 0 01-.75-.75zm.75 3.75a.75.75 0 000 1.5h10.5a.75.75 0 000-1.5H6.75z" clipRule="evenodd" />
        <path d="M4.5 12.75a.75.75 0 000 1.5h-.75a.75.75 0 000 1.5h.75a.75.75 0 000 1.5h-.75a.75.75 0 000 1.5h.75a3 3 0 003-3v-1.5a.75.75 0 00-.75-.75h-.75a.75.75 0 00-.75.75h-.75zm15 0a.75.75 0 010 1.5h.75a.75.75 0 010 1.5h-.75a.75.75 0 010 1.5h.75a.75.75 0 010 1.5h-.75a3 3 0 01-3-3v-1.5a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75h.75z" />
    </svg>
);

export const CertificateFrame = (props: SVGProps<SVGSVGElement>) => (
    <svg className="absolute inset-0 w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <rect width="100%" height="100%" rx="8" stroke="#a16207" strokeWidth="2"/>
        <rect x="8" y="8" width="calc(100% - 16px)" height="calc(100% - 16px)" rx="4" stroke="#f7b73b" strokeWidth="1.5"/>
        <rect x="12" y="12" width="calc(100% - 24px)" height="calc(100% - 24px)" stroke="#a16207" strokeWidth="0.5"/>
    </svg>
);

export const LaurelBranchIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 100 100" {...props}>
      <path d="M50 90 C 20 70, 20 30, 50 10" stroke="currentColor" strokeWidth="5" fill="none" />
      <path d="M50 90 C 80 70, 80 30, 50 10" stroke="currentColor" strokeWidth="5" fill="none" transform="scale(-1, 1) translate(-100, 0)" />
      {[20,35,50,65,80].map(y => (
        <g key={y}>
          <line x1="50" y1={y} x2={50-10} y2={y-10} stroke="currentColor" strokeWidth="4" />
          <line x1="50" y1={y} x2={50+10} y2={y-10} stroke="currentColor" strokeWidth="4" transform="scale(-1, 1) translate(-100, 0)"/>
        </g>
      ))}
    </svg>
);

export const AwardIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9 9 0 009 0zM19.5 9.75v.001M16.5 6.75v.001M12.75 4.5v.001M16.5 9.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
  </svg>
);

export const CoinIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.756a4.5 4.5 0 100 8.488M7.5 10.5h5.25m-5.25 3h5.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
