const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const files = fs.readdirSync('./stitch_exports').filter(f => f.endsWith('.html'));

files.forEach(f => {
  const content = fs.readFileSync('./stitch_exports/' + f, 'utf8');
  const dom = new JSDOM(content);
  const doc = dom.window.document;
  
  const main = doc.querySelector('main');
  if (!main) return;
  
  // Find header (either inside main or outside)
  const header = doc.querySelector('header');
  let titleHTML = '';
  let actionsHTML = '';
  
  if (header) {
    const h2 = header.querySelector('h2');
    if (h2) {
      titleHTML = h2.innerHTML;
    }
    
    // Find right-side actions
    const actionContainers = header.querySelectorAll('.flex.items-center.gap-2.border-l.border-slate-200, .flex.items-center.gap-4 > div:last-child');
    actionContainers.forEach(container => {
      Array.from(container.children).forEach(child => {
        // Exclude Notifications, Help, Profile, and user info div
        if (child.innerHTML.includes('notifications') || 
            child.innerHTML.includes('help_outline') || 
            child.innerHTML.includes('help') || 
            child.tagName === 'IMG' || 
            child.querySelector('img') ||
            (child.tagName === 'DIV' && child.querySelector('p.font-bold'))) {
          return;
        }
        // If it's the role switcher, skip it
        if (child.innerHTML.includes('Admin View') || child.innerHTML.includes('swap_horiz')) {
            return;
        }
        
        actionsHTML += child.outerHTML + '\n';
      });
    });
    
    // If header is inside main, remove it so it doesn't duplicate
    if (main.contains(header)) {
      header.remove();
    }
  }
  
  let newName = f.replace(/suler_ems___/, '').replace(/_[0-9a-f]{32}/, '').replace('.html', '');
  newName = newName.replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/_$/, '') + '.html';
  
  let outHtml = '';
  if (titleHTML) {
     outHtml += `<template id="page-title-template">${titleHTML}</template>\n`;
  }
  if (actionsHTML) {
     outHtml += `<template id="page-actions-template">\n${actionsHTML}\n</template>\n`;
  }
  
  // Extract FAB if present
  const fab = doc.querySelector('button.fixed.bottom-lg');
  if (fab && (!main.contains(fab))) {
     outHtml += `<template id="page-fab-template">\n${fab.outerHTML}\n</template>\n`;
  }
  
  outHtml += main.innerHTML;
  
  fs.writeFileSync('./views/' + newName, outHtml);
  console.log('Processed ' + newName);
});
