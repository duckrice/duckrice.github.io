// Builds the Duckware website (andris.no/duckware) from the content below:
// a front page and a page per app. GitHub Pages serves the files as they are.
//   node build.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "duckware");
const download = (repo, name) => `https://github.com/duckrice/${repo}/releases/latest/download/${name}-Setup.exe`;

const APPS = [
  {
    slug: "duckwriter",
    name: "DuckWriter",
    mark: "wr_",
    color: "#22d3ee",
    short: "Write documents and open Word files, made for reports and theses.",
    intro: "A word processor that opens and saves Word documents (.docx) and keeps them Word documents. Made for scientific writing: equations, footnotes, captions and cross-references, citations and a reference list, tracked changes and comments.",
    shots: [
      ["duckwriter-review.png", "Tracked changes and comments, as in Word"],
      ["duckwriter-equations.png", "Equations, typed in a LaTeX-like shorthand"],
    ],
    features: [
      ["Word files stay Word files", "Opens and saves .docx, and older .doc, .rtf and .odt. What DuckWriter doesn't edit itself stays in the file unchanged."],
      ["Equations", "Alt+= and type, LaTeX-style. They are saved as real Word equations."],
      ["Citations and references", "Add sources, cite them, and get the reference list in APA, IEEE and other styles."],
      ["Footnotes, captions, cross-references", "Numbered for you, and kept up to date as the document changes."],
      ["Review", "Tracked changes and comments, read and written the way Word does them."],
      ["PDF to Word", "Open a PDF and DuckWriter turns it into an editable document."],
      ["Spelling", "Norwegian and English, side by side."],
      ["Auto-save", "Nothing is lost if the computer shuts down: DuckWriter offers to bring the text back."],
      ["Copy pictures anywhere", "A picture copied from DuckWriter pastes into Word, Paint, chats and back."],
    ],
    keys: [
      ["Ctrl+S / Ctrl+Shift+S / F12", "Save / save as"],
      ["Alt+=", "Equation"],
      ["Ctrl+B / I / U", "Bold / italic / underline"],
      ["Ctrl+F / Ctrl+H", "Find / replace"],
      ["Alt+scroll wheel", "Bigger / smaller text"],
      ["Ctrl+scroll wheel", "Zoom"],
      ["Alt+Shift+W", "Write together"],
    ],
  },
  {
    slug: "duckument",
    name: "Duckument",
    mark: "pdf",
    color: "#f59e0b",
    short: "Sign, fill in and edit PDFs.",
    intro: "A small PDF app for the everyday jobs: signing a document, filling in a form, adding text and marking things up. Everything happens on your own computer; no account, no uploads.",
    shots: [["duckument.png", "Filling in a form that isn't fillable: the blanks are found for you"]],
    features: [
      ["Sign", "Draw your signature, type it, or use a photo of it. It's remembered, so the next document takes two clicks."],
      ["Fill in forms", "Fillable fields are found by themselves: click and type, Tab to the next."],
      ["Forms that aren't fillable", "Press T and the empty lines, boxes and tick boxes light up. Click one and type, sized to fit."],
      ["Edit text", "Press E and click any text to change it, in the same size and colour."],
      ["Shapes and pictures", "Rectangles, arrows, freehand, white-out, check marks, and pasted pictures."],
      ["Save as Word", "Turn a PDF into a Word document to edit it properly."],
      ["Redact", "Press B and draw over what must go. On saving, the text underneath is really removed from the file, not just covered."],
      ["Page numbers, headers and watermarks", "Page 1 of 9, your own header or footer text, or DRAFT across every page; each can still be moved, and Undo takes them all off."],
    ],
    keys: [
      ["V T E S", "Select, Text, Edit text, Sign"],
      ["C X", "Check mark, cross"],
      ["R O L A P W B", "Rectangle, ellipse, line, arrow, draw, white-out, redact"],
      ["Tab / Shift+Tab", "Next / previous blank"],
      ["Ctrl+Z / Ctrl+Y", "Undo / redo"],
      ["Ctrl+scroll wheel", "Zoom"],
    ],
    note: "The signature is a picture of your signature placed on the page, not a certificate-based digital signature.",
  },
  {
    slug: "ducknotes",
    name: "DuckNotes",
    mark: "nt/",
    color: "#a78bfa",
    short: "Notes for lectures, on an endless page, with drawing.",
    intro: "Note-taking made for lectures. It works like OneNote, but your notes stay on your own computer: each notebook is a folder in Documents\\DuckNotes, and pages save as you type.",
    shots: [["ducknotes.png", "A lecture page: text anywhere, a table, an equation and a diagram"]],
    features: [
      ["An endless page", "Click anywhere and write. Move text boxes around, make them wider, zoom with Ctrl+scroll wheel."],
      ["Lecture slides", "Add a PDF of the slides and write and draw right on them."],
      ["Pictures", "Ctrl+V pastes a picture where you last clicked, or drop picture files onto the page."],
      ["Drawing", "Pen, highlighter and eraser over the whole page; boxes, circles and arrows that stay attached."],
      ["Select and move", "With the select tool, drag a rectangle over things to move, recolour or delete them together."],
      ["Quick writing", "# for a heading, - for a list, [] for a checklist, $x^2$ for an equation, -> for an arrow."],
      ["Tables and equations", "Tables from the toolbar, Tab to the next cell; typeset maths with a preview."],
      ["Search", "Ctrl+E searches every notebook and marks what it finds."],
      ["Tags", "Mark lines Important, Question or Exam (Ctrl+2, 3, 4); one click lists every page with them."],
      ["Print or PDF", "Ctrl+P prints the page on its own, or saves it as a PDF."],
    ],
    keys: [
      ["Ctrl+N", "New page"],
      ["Ctrl+E", "Search all notes"],
      ["T V P H E", "Type, select, pen, highlighter, eraser"],
      ["L A R O D", "Line, arrow, box, circle, diamond"],
      ["Ctrl+drag", "Move the view"],
      ["Ctrl+2 / 3 / 4", "Tag: important, question, exam"],
      ["Ctrl+P", "Print, or save as PDF"],
      ["Alt+=", "Equation"],
    ],
  },
  {
    slug: "ducksheets",
    name: "DuckSheets",
    mark: "[#]",
    color: "#4ade80",
    short: "Spreadsheets that open and save Excel files.",
    intro: "A spreadsheet that opens and saves Excel workbooks (.xlsx, .xlsm) and CSV files, with about 260 of Excel's functions (checked against the real Excel), dynamic arrays, conditional formatting, drop-down lists, notes, charts and printing. Anything it doesn't edit yet stays in your Excel file unchanged.",
    shots: [["ducksheets.png", "A formula, a currency format and a chart"]],
    features: [
      ["Excel files stay Excel files", "Formulas, formats, widths, merged cells, frozen panes, filters and charts are kept as Excel keeps them."],
      ["Formulas", "About 260 of Excel's functions: lookups, text, dates, statistics, loans, trigonometry, binary and hex, complex numbers. Each one checked against the real Excel."],
      ["Dynamic arrays", "FILTER, SORT, UNIQUE, SEQUENCE and friends spill their results into the cells below, as in Excel 365."],
      ["Conditional formatting", "Colour cells above a value, duplicates, the top 10 or what a formula picks; data bars and colour scales."],
      ["Drop-down lists", "Data validation: choose from a list beside the cell, or limit what numbers can be typed."],
      ["Typing like Excel", "Select a cell and type. 10% becomes a percentage, 20.10.2026 a date; F4 switches $."],
      ["Fill handle", "Drag to copy formulas and continue series: numbers, weeks, months, weekdays, dates."],
      ["Data tools", "AutoSum, sort, filter with search, remove duplicates, text to columns, freeze panes, find and replace."],
      ["Notes and printing", "Notes on cells (Shift+F2), Format cells (Ctrl+1), Paste special, format painter, and printing or saving as PDF (Ctrl+P)."],
      ["Charts", "Column, bar, line, area, pie and doughnut, saved as real Excel charts."],
      ["Links and goal seek", "Ctrl+K links a cell; Goal seek finds the number that makes a formula give what you want."],
    ],
    keys: [
      ["Enter / Tab", "Down / right"],
      ["F2", "Edit the cell"],
      ["Alt+=", "AutoSum"],
      ["Ctrl+D / Ctrl+R", "Fill down / right"],
      ["Ctrl+Shift+L", "Filter"],
      ["Ctrl+; / Ctrl+Shift+;", "Today's date / the time"],
      ["Ctrl+1", "Format cells"],
      ["Ctrl+Alt+V", "Paste special"],
      ["Shift+F2", "Note on the cell"],
      ["Ctrl+P", "Print, or save as PDF"],
    ],
  },
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function page(title, description, body, depth) {
  const up = depth ? "../" : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="icon" href="${up}icons/duckware.png">
<link rel="stylesheet" href="${up}style.css">
</head>
<body>
<header class="top">
  <a class="brand" href="${up || "./"}"><img src="${up}icons/duckware.png" alt=""><span>duckware</span></a>
  <nav>${APPS.map((a) => `<a href="${up}${a.slug}/" style="--c:${a.color}">${a.name}</a>`).join("")}</nav>
</header>
<main>
${body}
</main>
<footer class="bottom">
  <span>duckware · free apps for Windows 10 and 11 · no accounts, no cloud, no subscriptions</span>
  <a href="https://github.com/duckrice">github.com/duckrice</a>
</footer>
</body>
</html>
`;
}

const installNote = `<p class="note">Windows may say <q>Windows protected your PC</q>, because the installers aren't code-signed (that costs money every year). Click <b>More info</b>, then <b>Run anyway</b>. After that the apps keep themselves up to date.</p>`;

function front() {
  const cards = APPS.map(
    (a) => `<a class="card" href="${a.slug}/" style="--c:${a.color}">
    <img src="icons/${a.slug}.png" alt="">
    <h3>${a.name}</h3>
    <p>${esc(a.short)}</p>
    <span class="more">read more →</span>
  </a>`,
  ).join("\n  ");
  return page(
    "duckware: free apps for writing, PDFs, notes and spreadsheets",
    "Free Windows apps that keep your files on your own computer: DuckWriter, Duckument, DuckNotes and DuckSheets.",
    `<section class="hero">
  <p class="prompt"><span>&gt;_</span> duckware</p>
  <h1>Free apps for writing, PDFs, notes and spreadsheets.</h1>
  <p class="lead">They open and save the files you already use (Word, PDF, Excel), keep everything on your own computer, and cost nothing. No accounts, no cloud, no subscriptions.</p>
  <div class="actions">
    <a class="btn primary" href="${download("duckware", "Duckware")}">Download the launcher</a>
    <span class="hint">One icon for your taskbar: it installs and updates the apps you pick.</span>
  </div>
  ${installNote}
</section>
<section>
  <h2>// the apps</h2>
  <div class="cards">
  ${cards}
  </div>
</section>
<section class="split">
  <div>
    <h2>// the launcher</h2>
    <p>Pin one icon to the taskbar. It opens any of the apps, installs the ones you don't have yet, shows which have updates, lists the documents you opened lately, and can start with Windows.</p>
    <p><a class="btn" href="${download("duckware", "Duckware")}">Download Duckware-Setup.exe</a></p>
  </div>
  <img class="shot" src="shots/duckware.png" alt="The Duckware launcher: a tile for each app and a list of recent documents">
</section>`,
    0,
  );
}

function appPage(a) {
  const shots = a.shots.map(([file, caption]) => `<figure><img class="shot" src="../shots/${file}" alt="${esc(caption)}"><figcaption>${esc(caption)}</figcaption></figure>`).join("\n");
  return page(
    `${a.name}: ${a.short}`,
    a.intro,
    `<section class="hero app" style="--c:${a.color}">
  <img class="app-icon" src="../icons/${a.slug}.png" alt="">
  <div>
    <h1>${a.name}</h1>
    <p class="lead">${esc(a.intro)}</p>
    <div class="actions">
      <a class="btn primary" href="${download(a.slug, a.name)}">Download ${a.name}-Setup.exe</a>
      <a class="btn" href="https://github.com/duckrice/${a.slug}/releases">What's new</a>
    </div>
    ${installNote}
  </div>
</section>
<section class="shots">
${shots}
</section>
<section style="--c:${a.color}">
  <h2>// what it does</h2>
  <div class="features">
    ${a.features.map(([t, d]) => `<div class="feature"><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join("\n    ")}
  </div>
  ${a.note ? `<p class="note">${esc(a.note)}</p>` : ""}
</section>
<section>
  <h2>// keys</h2>
  <table class="keys">
    ${a.keys.map(([k, d]) => `<tr><td><kbd>${esc(k)}</kbd></td><td>${esc(d)}</td></tr>`).join("\n    ")}
  </table>
</section>
<section>
  <h2>// help</h2>
  <p>Something not working, or missing? <a href="https://github.com/duckrice/${a.slug}/issues/new">Tell us on GitHub</a>. ${a.name} is free and open source: <a href="https://github.com/duckrice/${a.slug}">see the code</a>.</p>
</section>`,
    1,
  );
}

writeFileSync(join(root, "index.html"), front());
for (const a of APPS) {
  mkdirSync(join(root, a.slug), { recursive: true });
  writeFileSync(join(root, a.slug, "index.html"), appPage(a));
}
console.log("built", 1 + APPS.length, "pages");
