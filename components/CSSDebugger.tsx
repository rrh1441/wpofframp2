// components/CSSDebugger.tsx
"use client";

import React, { useEffect, useState } from 'react';

export default function CSSDebugger() {
  const [cssInfo, setCssInfo] = useState<{
    styleSheets: number;
    cssRules: number;
    proseRulesCount: number;
    cssLoaded: boolean;
    loadedSheets: string[];
    missingProse: boolean;
  }>({
    styleSheets: 0,
    cssRules: 0,
    proseRulesCount: 0,
    cssLoaded: false,
    loadedSheets: [],
    missingProse: true
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkCSS = () => {
      const sheets = document.styleSheets;
      const sheetCount = sheets.length;
      let rulesCount = 0;
      let proseCount = 0;
      const loadedSheetUrls: string[] = [];
      
      for (let i = 0; i < sheetCount; i++) {
        try {
          const sheet = sheets[i];
          if (sheet.href) {
            loadedSheetUrls.push(sheet.href);
          }
          
          const rules = sheet.cssRules;
          rulesCount += rules.length;
          
          for (let j = 0; j < rules.length; j++) {
            const rule = rules[j];
            if (rule.cssText && rule.cssText.includes('.prose')) {
              proseCount++;
            }
          }
        } catch (e) {
          // Cannot access rules from cross-origin stylesheets
          console.log('Could not access rules for sheet', i);
        }
      }
      
      setCssInfo({
        styleSheets: sheetCount,
        cssRules: rulesCount,
        proseRulesCount: proseCount,
        cssLoaded: rulesCount > 0,
        loadedSheets: loadedSheetUrls,
        missingProse: proseCount === 0
      });
    };
    
    // Check initially
    checkCSS();
    
    // Set up a timer to check periodically (for lazy-loaded CSS)
    const intervalId = setInterval(checkCSS, 2000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="fixed bottom-0 right-0 bg-white border border-gray-300 shadow-lg rounded-tl-lg p-4 max-w-lg z-50 text-xs overflow-auto max-h-80">
      <h3 className="font-bold mb-2 text-sm">CSS Debug Info</h3>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>StyleSheets Loaded:</span>
          <span className={cssInfo.styleSheets > 0 ? 'text-green-600' : 'text-red-600'}>
            {cssInfo.styleSheets}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Total CSS Rules:</span>
          <span className={cssInfo.cssRules > 0 ? 'text-green-600' : 'text-red-600'}>
            {cssInfo.cssRules}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Prose Rules Found:</span>
          <span className={cssInfo.proseRulesCount > 0 ? 'text-green-600' : 'text-red-600'}>
            {cssInfo.proseRulesCount}
          </span>
        </div>
        
        <hr className="my-2" />
        
        {cssInfo.missingProse && (
          <div className="bg-yellow-100 p-2 rounded text-yellow-800 mb-2">
            <strong>Warning:</strong> No prose rules detected! The @tailwindcss/typography plugin may not be properly installed or configured.
          </div>
        )}
        
        {cssInfo.loadedSheets.length > 0 && (
          <div>
            <div className="font-semibold">Loaded Stylesheets:</div>
            <ul className="list-disc ml-4 mt-1 max-h-32 overflow-y-auto">
              {cssInfo.loadedSheets.map((sheet, idx) => (
                <li key={idx} className="truncate">
                  {sheet}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="mt-2 text-gray-500">
          This debugger updates every 2 seconds. Keep open while testing.
        </div>
      </div>
    </div>
  );
}