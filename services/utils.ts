export const markdownToHtml = (text: string): string => {
  if (!text) return '';
  
  let html = text;

  // Process headings first (e.g., ### Observation)
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold text-slate-700 mb-2">$1</h3>');

  // Process bold text (e.g., **Action**)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Process unordered lists (lines starting with * or -)
  html = html.replace(/^\s*([*-]) (.*$)/gim, '<ul><li>$2</li></ul>')
             .replace(/<\/ul>\s*<ul>/g, ''); // Merge consecutive lists

  // Process newlines that are not part of a list
  html = html.replace(/^(?!<h3|<ul)(.*)<br \/>/gim, '$1'); // clean up extra breaks
  html = html.replace(/\n/g, '<br />');


  return html;
};
