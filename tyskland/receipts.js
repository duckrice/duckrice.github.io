// Reading German supermarket receipts: the items with their prices, the total, the date, and
// which items are alcohol (by German drink words and brands; alcohol-free drinks don't count).

const ALCOHOL = [
  "bier", "pils", "pilsener", "pilsner", "weizen", "weissbier", "weißbier", "hefeweizen", "radler", "helles", "export", "lager", "kölsch", "koelsch", "altbier", "bock", "starkbier", "maibock", "craft beer",
  "wein", "rotwein", "weisswein", "weißwein", "rosé", "rose wein", "glühwein", "gluehwein", "sekt", "prosecco", "champagner", "cava", "sangria", "lambrusco", "riesling", "merlot", "chianti", "primitivo", "dornfelder", "spritz",
  "wodka", "vodka", "rum", "gin", "whisky", "whiskey", "korn", "schnaps", "likör", "likoer", "jägermeister", "jaegermeister", "aperol", "campari", "ramazzotti", "tequila", "ouzo", "sambuca", "amaretto", "baileys", "absinth", "cognac", "brandy", "weinbrand", "obstler", "doppelkorn", "kräuterlikör",
  "beck's", "becks", "krombacher", "warsteiner", "bitburger", "paulaner", "erdinger", "franziskaner", "augustiner", "veltins", "jever", "radeberger", "oettinger", "hasseröder", "hasseroeder", "carlsberg", "heineken", "corona", "desperados", "astra", "flensburger", "köstritzer", "berliner kindl", "sternburg", "tannenzäpfle", "rothaus", "löwenbräu", "spaten", "hacker-pschorr", "kilkenny", "guinness", "smirnoff", "bacardi", "havana", "captain morgan", "jack daniel", "jim beam", "absolut", "gorbatschow", "mixery", "mumm", "rotkäppchen", "freixenet", "kleiner feigling", "berentzen",
];
// Words that contain a drink word but aren't drinks.
const NOT_ALCOHOL = /alkoholfrei|alkohol frei|0[,.]0 ?%|weintraub|weinessig|weinbergpfirsich|rumpsteak|ginger|popcorn|körner|koerner|bierschinken|bierwurst|bierstick|bierbeisser|bierkaese|exportschinken|hefe(?!weizen)|weinsauerkraut/i;
const SKIP = /summe|zu zahlen|gesamt|total|zwischensumme|mwst|ust|netto|brutto|steuer|bar\b|ec[- ]?karte|karte|kreditkarte|girocard|visa|mastercard|rückgeld|rueckgeld|gegeben|kundenbeleg|terminal|trace|beleg|bonus|payback|punkte/i;
const TOTAL = /summe|zu zahlen|gesamtbetrag|gesamt|total/i;

const words = ALCOHOL.map((w) => new RegExp(`(^|[^a-zäöüß])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-zäöüß])`, "i"));
// Drink words that are often the start of a longer word on receipts ("Pilsener", "Weinbrand", "Bierkasten").
const prefixes = ["bier", "wein", "sekt", "pils", "weizen", "radler"].map((w) => new RegExp(`(^|[^a-zäöüß])${w}`, "i"));

export function isAlcohol(text) {
  if (NOT_ALCOHOL.test(text)) return false;
  return words.some((re) => re.test(text)) || prefixes.some((re) => re.test(text));
}

const money = (s) => Number(s.replace(/\s/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));

/** The receipt's lines read into items, total and date. Pfand right after a drink counts with the drink. */
export function parseReceipt(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items = [];
  let total = null;
  for (const line of lines) {
    const m = /^(.*?)\s*(-?\d{1,4}(?:[.,]\d{3})*[.,]\d{2})\s*-?\s*[A-Z*]{0,2}\s*$/.exec(line);
    if (!m) continue;
    const name = m[1].replace(/[\s.:*x×]+$/, "").trim();
    let amount = money(m[2]);
    if (/-\s*[A-Z*]{0,2}\s*$/.test(line) && amount > 0) amount = -amount;
    if (TOTAL.test(name) && !/zwischen/i.test(name)) {
      if (total === null || amount > total) total = amount;
      continue;
    }
    if (!name || SKIP.test(name) || /^\d+([.,]\d+)?\s*(x|stk|kg)/i.test(name) && !/[a-zäöü]{3}/i.test(name)) continue;
    const pfand = /pfand|leergut/i.test(name);
    const alcohol = pfand ? items.length > 0 && items[items.length - 1].alcohol && amount > 0 : isAlcohol(name);
    items.push({ name, amount, alcohol });
  }
  const date = /(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})/.exec(text);
  const iso = date ? `${date[3].length === 2 ? "20" + date[3] : date[3]}-${date[2].padStart(2, "0")}-${date[1].padStart(2, "0")}` : null;
  const sum = Math.round(items.reduce((s, i) => s + i.amount, 0) * 100) / 100;
  return { store: lines[0] ?? "", date: iso, items, total: total ?? sum };
}

/** What a receipt counts for: its total without the alcohol on it. */
export function spending(receipt) {
  const alcohol = receipt.items.filter((i) => i.alcohol).reduce((s, i) => s + i.amount, 0);
  return { total: receipt.total, alcohol: Math.round(alcohol * 100) / 100, counted: Math.round((receipt.total - alcohol) * 100) / 100 };
}
