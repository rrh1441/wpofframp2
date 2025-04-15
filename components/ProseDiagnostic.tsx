// components/ProseDiagnostic.tsx
import React, { useEffect, useState } from 'react';

export default function ProseDiagnostic() {
  const [diagnostics, setDiagnostics] = useState<{
    proseRulesFound: boolean;
    proseModifiersFound: boolean;
    proseClasses: string[];
    cssRules: number;
    cssText: string;
  }>({
    proseRulesFound: false,
    proseModifiersFound: false,
    proseClasses: [],
    cssRules: 0,
    cssText: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if Tailwind Typography styles are loaded
      const cssRules = Array.from(document.styleSheets)
        .filter(sheet => {
          try {
            // This will throw an error if the sheet is from a different origin
            return !sheet.href || sheet.href.startsWith(window.location.origin);
          } catch (e) {
            return false;
          }
        })
        .flatMap(sheet => {
          try {
            return Array.from(sheet.cssRules);
          } catch (e) {
            return [];
          }
        });

      // Find prose rules
      const proseRules = cssRules.filter(rule => 
        rule.cssText && rule.cssText.includes('.prose')
      );
      
      // Extract prose classes
      const proseClassRegex = /\.(prose[a-zA-Z0-9\-\_]*)/g;
      const proseClasses: string[] = [];
      
      proseRules.forEach(rule => {
        const matches = rule.cssText.matchAll(proseClassRegex);
        for (const match of matches) {
          if (match[1] && !proseClasses.includes(match[1])) {
            proseClasses.push(match[1]);
          }
        }
      });
      
      // Check for modifiers like prose-sm, prose-lg
      const proseModifiersFound = proseClasses.some(className => 
        className !== 'prose' && className.startsWith('prose-')
      );

      // Get a sample of CSS text for debugging
      const sampleCssText = proseRules.length > 0 
        ? proseRules.slice(0, 3).map(r => r.cssText).join('\n\n').substring(0, 500) + '...'
        : 'No prose rules found';

      setDiagnostics({
        proseRulesFound: proseRules.length > 0,
        proseModifiersFound,
        proseClasses,
        cssRules: cssRules.length,
        cssText: sampleCssText
      });
    }
  }, []);

  // Test content to check styling
  const testContent = `
    <h1>Heading 1 (Test)</h1>
    <p>This is a paragraph with <strong>bold text</strong> and <em>italic text</em>.</p>
    <ul>
      <li>List item 1</li>
      <li>List item 2</li>
    </ul>
    <a href="#">This is a link</a>
  `;

  return (
    <div className="p-4 border rounded-md space-y-6">
      <h2 className="text-xl font-bold">Tailwind Typography Diagnostic</h2>
      
      <div className="space-y-2">
        <h3 className="font-semibold">CSS Rules Detected</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-100 p-2 rounded">Total CSS Rules:</div>
          <div className="bg-gray-100 p-2 rounded">{diagnostics.cssRules}</div>
          
          <div className="bg-gray-100 p-2 rounded">Prose Rules Found:</div>
          <div className={`p-2 rounded ${diagnostics.proseRulesFound ? 'bg-green-100' : 'bg-red-100'}`}>
            {diagnostics.proseRulesFound ? 'Yes' : 'No'}
          </div>
          
          <div className="bg-gray-100 p-2 rounded">Prose Modifiers Found:</div>
          <div className={`p-2 rounded ${diagnostics.proseModifiersFound ? 'bg-green-100' : 'bg-red-100'}`}>
            {diagnostics.proseModifiersFound ? 'Yes' : 'No'}
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold">Detected Prose Classes</h3>
        <div className="flex flex-wrap gap-2">
          {diagnostics.proseClasses.length > 0 ? (
            diagnostics.proseClasses.map(cls => (
              <span key={cls} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                {cls}
              </span>
            ))
          ) : (
            <span className="text-red-500">No prose classes detected</span>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold">Sample CSS Rules</h3>
        <pre className="bg-gray-100 p-3 text-xs overflow-auto max-h-40 rounded">
          {diagnostics.cssText}
        </pre>
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold">Test Rendering</h3>
        <div className="border p-4 rounded-md">
          <h4 className="text-sm font-medium mb-2">Without prose class:</h4>
          <div dangerouslySetInnerHTML={{ __html: testContent }} />
        </div>
        
        <div className="border p-4 rounded-md">
          <h4 className="text-sm font-medium mb-2">With prose class:</h4>
          <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: testContent }} />
        </div>
        
        <div className="border p-4 rounded-md">
          <h4 className="text-sm font-medium mb-2">With nested prose class (recommended fix):</h4>
          <div className="bg-white p-4">
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: testContent }} />
          </div>
        </div>
      </div>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 text-sm">
        <h3 className="font-medium text-yellow-800">How to use this diagnostic</h3>
        <p className="mt-2 text-yellow-700">
          Add this component to any page to debug Tailwind Typography issues. 
          If "Prose Rules Found" shows "No", your @tailwindcss/typography plugin is not properly installed or configured.
          If prose classes are detected but styling isn't applied, check for CSS specificity issues or React 19 compatibility problems.
        </p>
      </div>
    </div>
  );
}