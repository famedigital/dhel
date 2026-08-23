/** Bhutan National QR (EMVCo) helpers — adapted from POS without POS commerce deps. */

const EMV_CURRENCY = "BTN"; // ISO numeric often 064; Bhutan SCAN&PAY uses BTN alpha in some wallets — POS used numeric via COMMERCE

function tlv(tag: string, value: string): string {
  return `${tag}${String(value.length).padStart(2, "0")}${value}`;
}

export function parseEmv(payload: string): Map<string, string> {
  const map = new Map<string, string>();
  const raw = payload.replace(/[\n\r\t]/g, "").trim();
  let i = 0;
  while (i + 4 <= raw.length) {
    const tag = raw.slice(i, i + 2);
    const len = Number(raw.slice(i + 2, i + 4));
    if (!Number.isFinite(len) || len < 0) break;
    const value = raw.slice(i + 4, i + 4 + len);
    if (tag !== "63") map.set(tag, value);
    i += 4 + len;
  }
  return map;
}

export function crc16ccitt(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function serializeInner(map: Map<string, string>): string {
  const tags = [...map.keys()].filter((tag) => tag !== "63").sort();
  let body = "";
  for (const tag of tags) {
    body += tlv(tag, map.get(tag) ?? "");
  }
  return body;
}

function serialize(map: Map<string, string>): string {
  const withLen = `${serializeInner(map)}6304`;
  return `${withLen}${crc16ccitt(withLen)}`;
}

function mergeAdditionalData(existing: string, remarks?: string): string {
  const inner = parseEmv(existing);
  const note = remarks?.trim().slice(0, 25);
  if (note) inner.set("05", note);
  else inner.delete("05");
  return serializeInner(inner);
}

/** Build static EMV from typed account (BoB/BNB merchant account string). */
export function buildStaticEmv(input: {
  merchant: string;
  name: string;
  city?: string;
  currency?: string;
}): string {
  const map = new Map<string, string>([
    ["00", "01"],
    ["01", "11"],
    ["26", input.merchant.slice(0, 32)],
    ["52", "5411"],
    ["53", input.currency || "064"],
    ["58", "BT"],
    ["59", input.name.slice(0, 25)],
    ["60", (input.city || "Thimphu").slice(0, 15)],
  ]);
  return serialize(map);
}

export function emvAccount(payload: string): string {
  const inner = parseEmv(payload).get("26") ?? "";
  return parseEmv(inner).get("01") || inner;
}

export function emvPayee(payload: string): string {
  return (parseEmv(payload).get("59") || "").trim();
}

export function buildDynamicEmv(
  staticPayload: string,
  amountNu: number,
  remarks: string,
): string {
  if (!staticPayload.trim()) return "";
  const map = parseEmv(staticPayload);
  map.set("01", "12");
  if (!map.get("53")) map.set("53", "064");
  map.set("54", amountNu.toFixed(2));
  map.set("62", mergeAdditionalData(map.get("62") || "", remarks));
  return serialize(map);
}

export { EMV_CURRENCY };
