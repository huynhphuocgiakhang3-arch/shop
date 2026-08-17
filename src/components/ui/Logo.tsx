import { cn } from "@/lib/utils";

export function Logo({className}:{className?:string}){
 return <div className={cn("group flex items-center gap-3",className)}>
   <div className="relative h-10 w-10 shrink-0">
     <div className="absolute -inset-1 rounded-[15px] bg-accent-orange/15 blur-md transition-opacity duration-300 group-hover:opacity-100"/>
     <div className="absolute inset-0 rounded-[13px] border border-white/15 bg-gradient-to-br from-[#ffb067] via-accent-orange to-accent-orange-deep shadow-[0_8px_28px_rgba(255,138,61,.18)] transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105"/>
     <svg viewBox="0 0 36 36" className="relative h-10 w-10" fill="none" aria-hidden="true">
       <path d="M18 3 L31 10.5 V25.5 L18 33 L5 25.5 V10.5 Z" stroke="rgba(255,255,255,.9)" strokeWidth="1.4" fill="rgba(255,255,255,.06)"/>
       <path d="M18 3 V33 M5 10.5 L31 25.5 M31 10.5 L5 25.5" stroke="rgba(255,255,255,.3)" strokeWidth=".65"/>
     </svg>
   </div>
   <span className="font-display text-[18px] font-semibold tracking-[-.02em] text-white">KhangHuynh <span className="text-gradient-orange">Vault</span></span>
 </div>;
}
