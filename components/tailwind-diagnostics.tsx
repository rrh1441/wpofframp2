// pages/tailwind-diagnostics.tsx
import React, { useEffect } from 'react';

export default function TailwindDiagnostics() {
  useEffect(() => {
    // Log diagnostic information about Tailwind setup
    console.log('==========================================');
    console.log('TAILWIND TYPOGRAPHY DIAGNOSTICS');
    console.log('==========================================');
    
    // Check if any style sheets are loaded
    const styleSheets = document.styleSheets;
    console.log(`Loaded StyleSheets: ${styleSheets.length}`);
    
    // Attempt to find any prose classes
    let foundProseRules = false;
    let proseRuleCount = 0;
    let accessibleSheets = 0;
    
    for (let i = 0; i < styleSheets.length; i++) {
      try {
        const sheet = styleSheets[i];
        accessibleSheets++;
        
        // Log sheet info
        console.log(`StyleSheet ${i}: ${sheet.href || '(inline)'}`);
        console.log(`  Rules: ${sheet.cssRules.length}`);
        
        // Check for prose rules
        for (let j = 0; j < sheet.cssRules.length; j++) {
          const rule = sheet.cssRules[j];
          if (rule.cssText && rule.cssText.includes('.prose')) {
            if (!foundProseRules) {
              console.log('FOUND PROSE RULES:');
              foundProseRules = true;
            }
            proseRuleCount++;
            console.log(`  Rule ${j}: ${rule.cssText.substring(0, 100)}...`);
          }
        }
      } catch (e) {
        console.log(`  StyleSheet ${i}: Cannot access rules (likely cross-origin)`);
      }
    }
    
    console.log(`Accessible StyleSheets: ${accessibleSheets} of ${styleSheets.length}`);
    console.log(`Found ${proseRuleCount} prose rules`);
    
    // Add test elements to check styling
    const testDiv = document.createElement('div');
    testDiv.className = 'prose';
    testDiv.innerHTML = '<h1>Test Heading</h1><p>Test paragraph</p>';
    document.body.appendChild(testDiv);
    
    // Check computed styles
    console.log('COMPUTED STYLES FOR TEST ELEMENTS:');
    try {
      const heading = testDiv.querySelector('h1');
      const paragraph = testDiv.querySelector('p');
      
      if (heading) {
        const headingStyles = window.getComputedStyle(heading);
        console.log('Heading Styles:', {
          fontSize: headingStyles.fontSize,
          fontWeight: headingStyles.fontWeight,
          color: headingStyles.color,
          marginTop: headingStyles.marginTop,
          marginBottom: headingStyles.marginBottom
        });
      }
      
      if (paragraph) {
        const paragraphStyles = window.getComputedStyle(paragraph);
        console.log('Paragraph Styles:', {
          fontSize: paragraphStyles.fontSize,
          lineHeight: paragraphStyles.lineHeight,
          color: paragraphStyles.color,
          marginTop: paragraphStyles.marginTop,
          marginBottom: paragraphStyles.marginBottom
        });
      }
    } catch (e) {
      console.error('Error checking computed styles:', e);
    }
    
    // Cleanup
    document.body.removeChild(testDiv);
    
    console.log('==========================================');
    console.log('END TAILWIND TYPOGRAPHY DIAGNOSTICS');
    console.log('==========================================');
  }, []);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Tailwind Diagnostics</h1>
      <p>Check your terminal/console for diagnostic information.</p>
      
      <div className="mt-8 border p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Sample Prose Test</h2>
        <div className="prose">
          <h1>This is a prose h1</h1>
          <p>This is a prose paragraph.</p>
          <ul>
            <li>List item 1</li>
            <li>List item 2</li>
          </ul>
          <a href="#">This is a prose link</a>
        </div>
      </div>
    </div>
  );
}