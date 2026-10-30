// Reading German supermarket receipts: the items with their prices, the total, the date, and
// which items are alcohol (by German drink words and brands; alcohol-free drinks don't count).

const ALCOHOL = [
  "bier", "pils", "pilsener", "pilsner", "weizen", "weizenbier", "kristallweizen", "weissbier", "weißbier", "hefeweizen", "radler", "helles", "hell", "export", "lager", "kölsch", "koelsch", "altbier", "bock", "starkbier", "maibock", "craft beer", "ipa", "dunkel", "märzen", "maerzen",
  "wein", "rotwein", "weisswein", "weißwein", "rosé", "rose wein", "glühwein", "gluehwein", "federweißer", "federweisser", "sekt", "prosecco", "champagner", "cava", "sangria", "lambrusco", "riesling", "merlot", "chianti", "primitivo", "dornfelder", "spritz", "grauburgunder", "weißburgunder", "weissburgunder", "spätburgunder", "spaetburgunder", "müller-thurgau", "silvaner", "trollinger", "portugieser", "lemberger", "chardonnay", "sauvignon", "pinot", "cabernet", "shiraz", "tempranillo", "rioja", "montepulciano", "nero d'avola", "zweigelt",
  "wodka", "vodka", "rum", "gin", "whisky", "whiskey", "korn", "schnaps", "likör", "likoer", "eierlikör", "jägermeister", "jaegermeister", "aperol", "campari", "ramazzotti", "tequila", "ouzo", "sambuca", "amaretto", "baileys", "absinth", "cognac", "brandy", "weinbrand", "obstler", "doppelkorn", "kräuterlikör", "kümmerling", "pfeffi", "asbach", "mariacron", "malibu", "pitu", "licor 43", "strothmann", "küstennebel", "sierra", "metaxa",
  "beck's", "becks", "krombacher", "warsteiner", "bitburger", "paulaner", "erdinger", "franziskaner", "augustiner", "veltins", "jever", "radeberger", "oettinger", "hasseröder", "hasseroeder", "carlsberg", "heineken", "corona", "desperados", "astra", "flensburger", "köstritzer", "berliner kindl", "sternburg", "tannenzäpfle", "rothaus", "löwenbräu", "spaten", "hacker-pschorr", "kilkenny", "guinness", "holsten", "diebels", "schöfferhofer", "einbecker", "wernesgrüner", "kulmbacher", "tucher", "maisel", "weihenstephaner", "hofbräu", "störtebeker", "gösser", "perlenbacher", "karlskrone", "5,0 original", "hansa pils", "paderborner", "feldschlößchen", "ur-krostitzer", "schneider weisse",
  "smirnoff", "bacardi", "havana", "captain morgan", "jack daniel", "jim beam", "absolut", "gorbatschow", "mixery", "mumm", "rotkäppchen", "freixenet", "kleiner feigling", "berentzen", "henkell", "faber", "söhnlein", "kupferberg", "hugo",
];
// Words that contain a drink word but aren't drinks, and drinks without alcohol.
const NOT_ALCOHOL = /alkoholfrei|alkohol frei|alc\.? ?frei|0[,.]0 ?%|\b0[,.]0\b|becks? blue|beck's blue|jever fun|clausthaler|weintraub|weinessig|weinbergpfirsich|weingummi|weinblätter|weinblaetter|weinsauerkraut|rumpsteak|ginger|popcorn|körner|koerner|bierschinken|bierwurst|bierstick|bierbeisser|bierkaese|bierkäse|exportschinken|hefe(?!weizen)|weizen(mehl|brot|brötchen|broetchen|toast|kleie|grieß|tortilla|wrap|keim)|hell(e|er|es)? ?(brot|brötchen)|korn(spitz|brot|brötchen)|dunkel(e|es)? ?(brot|schoko)|lagerung|gin(seng|kgo)|hugo boss|helles? (toast|mehl)/i;
// (After at most one stray mark from the paper's edge: "I SUMME".)
const TOTAL = /^(?:\S\s+)?(summe|zu zahlen|gesamtbetrag|gesamt|total|endsumme|betrag)\b/i;
// A deposit, or a discount: it goes with the drink just above it.
const DEPOSIT = /pfand|\b[pf]f?and\b|leergut/i; // "Ffand": Pfand as a photo is sometimes read
const DISCOUNT = /rabatt|preisvorteil|vorteil|coupon|nachlass|aktion|ersparnis/i;
// The chains, to name the shop even when the photo's first line is noise.
const CHAINS = /\b(rewe|lidl|aldi(?: süd| sued| nord)?|edeka|netto|penny|kaufland|norma|real|globus|tegut|dm|rossmann|müller|marktkauf|hit|famila|combi|nahkauf)\b/i;

const words = ALCOHOL.map((w) => new RegExp(`(^|[^a-zäöüß])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-zäöüß])`, "i"));
// Drink words that are often the start of a longer word on receipts ("Pilsener", "Weinbrand", "Bierkasten", "Weißb.").
const prefixes = ["bier", "wein", "sekt", "pils", "radler", "weißb", "weissb"].map((w) => new RegExp(`(^|[^a-zäöüß])${w}`, "i"));

export function isAlcohol(text) {
  if (NOT_ALCOHOL.test(text)) return false;
  return words.some((re) => re.test(text)) || prefixes.some((re) => re.test(text));
}

// The cents as printed: a photo may add a stray third digit ("0,993") or read a 0 as O or C ("0,C8").
const money = (s) =>
  Number(
    s
      .replace(/\s/g, "")
      .replace(/([.,;][\dOoC]{2})[\dOoC]$/, "$1")
      .replace(/[OoC](?=[\dOoC]?$)/g, "0")
      .replace(/\.(?=\d{3}\b)/g, "")
      .replace(/[,;]/, "."),
  );
// A price at the end of a line, maybe with a minus, € or EUR, and the tax letter ("1,29 A", "0,30- B", "-0,50").
// (";" is how a photo's comma is sometimes read.)
const PRICE = /^(.*?)\s*(-?\s?\d{1,4}(?:[.,]\d{3})*[.,;]\s?[\dOoC]{2}\d?)\s*(-)?\s*(?:€|EUR)?\s*[A-Z*]{0,2}\s*\*?$/;
// A quantity or weight: "2 x", "2 Stk x", "0,856 kg x 1,29 EUR/kg" (the unit may be misread: "2 Sik x").
const QUANTITY = /^\d+(?:[.,]\d+)?\s*(?:kg|[a-z]{1,3}\.?\s*[x×]|[x×])(?![a-zäöü])/i;
// Below the items: how it was paid. A receipt whose total couldn't be read stops here.
const PAYMENT = /^(?:\S\s+)?(kartenzahlung|girocard|ec[- ]?karte|ec-cash|bar|visa|mastercard|maestro|geg(eben|\.)|zahlung|rückgeld|rueckgeld|kreditkarte|v pay)\b/i;
const AMOUNTS = /\d[.,;]\s?\d{2}(?!\d)/g;
// A name followed by its count and unit price ("Pfand Mehrweg   2 x 0,08", "Pils 0,5l   0,79 x 6").
const COUNTED = /\s+(?:\d+\s*[x×]\s*\d{1,4}[.,]\d{2}|\d{1,4}[.,]\d{2}\s*[x×]\s*\d+)\s*$/i;

/** The receipt's lines read into items, total and date. Pfand and discounts right after a drink count with the drink. */
export function parseReceipt(text) {
  // Characters a photo is often read as: a dotless i, low quotes for commas, long dashes for minus.
  text = text.replace(/ı/g, "i").replace(/[‚¸]/g, ",").replace(/[—–]+-?/g, "-").replace(/„(?=\d)/g, "-");
  // The paper's edge in a photo can be read as a stray mark at either end of a line.
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/^[|\[\]{}()!;'‘’"]+\s*/, "").replace(/\s*[|\[\]{}()!;'‘’"]+$/, ""))
    .filter(Boolean);
  const items = [];
  let total = null;
  // A name whose price comes on the next line (weighed goods, several of a kind).
  let pending = null;
  const add = (name, amount) => {
    const previous = items[items.length - 1];
    const follows = previous?.alcohol && ((DEPOSIT.test(name) && amount > 0) || (DISCOUNT.test(name) && amount < 0));
    items.push({ name, amount, alcohol: DEPOSIT.test(name) || DISCOUNT.test(name) ? Boolean(follows) : isAlcohol(name) });
  };
  for (const line of lines) {
    if (PAYMENT.test(line)) break;
    // A tax table's row ("A 19% 0,92 4,82 5,74"): three amounts are never one item.
    if ((line.match(AMOUNTS) ?? []).length >= 3) continue;
    const m = PRICE.exec(line);
    if (!m) {
      // A name alone, or a name with its count: the price follows.
      const name = line.replace(COUNTED, "").trim();
      pending = /[a-zäöü]{3}/i.test(name) && !QUANTITY.test(name) ? name : null;
      continue;
    }
    // Dot leaders ("Milch ..... 0,99") go; an abbreviation's dot ("halbtr.") stays.
    let name = m[1].replace(/(\s|\.{2,}|[:*])+$/, "").trim();
    let amount = money(m[2]);
    // A discount takes money off, even when its minus wasn't printed or read.
    if ((m[3] || DISCOUNT.test(m[1])) && amount > 0) amount = -amount;
    if (TOTAL.test(name)) {
      // Everything below the total is payment, tax and the card slip.
      total = amount;
      break;
    }
    if (COUNTED.test(` ${name} ${m[2]}`) && /\d\s*[x×]$/i.test(name)) {
      // "Augustiner Hell 0,5l   2 x 1,29": the line total comes next; "2 x 0,89" alone is a breakdown.
      const rest = name.replace(/\s*\d+\s*[x×]$/i, "").trim();
      pending = /[a-zäöü]{3}/i.test(rest) && !QUANTITY.test(rest) ? rest : null;
      continue;
    }
    if (!name || QUANTITY.test(name)) {
      // A price alone, or a weight line: it belongs to the name above, if that is still waiting.
      if (pending) add(pending, amount);
      pending = null;
      continue;
    }
    pending = null;
    if (!/[a-zäöü]{2}/i.test(name)) continue;
    add(name, amount);
  }
  // "SUMME" unreadable in a photo: a last amount that adds up everything above it is the total.
  if (total === null && items.length > 1) {
    const last = items[items.length - 1].amount;
    const above = items.slice(0, -1).reduce((s, i) => s + i.amount, 0);
    if (Math.abs(last - above) <= 0.06) total = items.pop().amount;
  }
  // The date: the first real day and month (not a phone number).
  let iso = null;
  for (const d of text.matchAll(/(?<!\d)(\d{1,2})[.\/](\d{1,2})[.\/](\d{4}|\d{2})(?!\d)/g)) {
    if (+d[1] >= 1 && +d[1] <= 31 && +d[2] >= 1 && +d[2] <= 12) {
      iso = `${d[3].length === 2 ? "20" + d[3] : d[3]}-${d[2].padStart(2, "0")}-${d[1].padStart(2, "0")}`;
      break;
    }
  }
  const sum = Math.round(items.reduce((s, i) => s + i.amount, 0) * 100) / 100;
  const store = lines.slice(0, 5).find((l) => CHAINS.test(l)) ?? lines.find((l) => /[a-zäöü]{3}/i.test(l)) ?? "";
  return { store, date: iso, items, total: total ?? sum };
}

/** What a receipt counts for: its total without the alcohol on it. */
export function spending(receipt) {
  const alcohol = receipt.items.filter((i) => i.alcohol).reduce((s, i) => s + i.amount, 0);
  return { total: receipt.total, alcohol: Math.round(alcohol * 100) / 100, counted: Math.round((receipt.total - alcohol) * 100) / 100 };
}
