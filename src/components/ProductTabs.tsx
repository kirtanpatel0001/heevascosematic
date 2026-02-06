"use client";

import { useState } from "react";
import { Check, FileText } from "lucide-react";
import { Montserrat, Playfair_Display } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"] });
const playfair = Playfair_Display({ subsets: ["latin"] });

interface ProductTabsProps {
  description?: string;
  ingredients?: string;
}

export default function ProductTabs({ 
  description = "", 
  ingredients = ""
}: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState("description");

  const tabs = [
    { id: "description", label: "Description", icon: FileText },
    { id: "ingredients", label: "Ingredients", icon: Check },
  ];

  return (
    <div className={`w-full max-w-[1440px] mx-auto px-6 my-20 ${montserrat.className}`}>
      
      {/* 1. TAB NAVIGATION */}
      <div className="flex flex-wrap justify-center border-b border-zinc-200 mb-12">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-4 text-sm font-bold uppercase tracking-widest border-b-2 transition-all duration-300
                ${activeTab === tab.id 
                  ? "border-black text-black" 
                  : "border-transparent text-zinc-400 hover:text-zinc-600 hover:border-zinc-200"
                }
              `}
            >
              <Icon size={16} className="mb-0.5"/>
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 2. TAB CONTENT AREA */}
      <div className="min-h-[200px] animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* --- DESCRIPTION TAB --- */}
        {activeTab === "description" && (
          <div className="max-w-4xl mx-auto text-center">
            <h3 className={`${playfair.className} text-3xl font-medium mb-8`}>Product Story</h3>
            <div className="text-zinc-600 leading-8 whitespace-pre-wrap text-base md:text-lg text-left md:text-center">
              {description || "No description available."}
            </div>
          </div>
        )}

        {/* --- INGREDIENTS TAB --- */}
        {activeTab === "ingredients" && (
          <div className="max-w-3xl mx-auto bg-zinc-50 p-8 rounded-2xl border border-zinc-100">
             <h3 className={`${playfair.className} text-2xl font-medium mb-6 text-center`}>Clean Ingredients</h3>
             <p className="text-zinc-600 text-sm leading-8 font-mono text-center whitespace-pre-wrap">
                {ingredients || "Ingredients list coming soon."}
             </p>
          </div>
        )}

      </div>
    </div>
  );
}