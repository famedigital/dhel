import type { ReactNode } from "react";
import type {
  Brand,
  Itinerary,
  ItineraryContent,
  ItineraryOpsBundle,
  ItineraryStay,
} from "@/lib/types";
import { DEFAULT_COVER, DEFAULT_SIGNATORY, collectDocumentImageUrls, resolveImage } from "@/lib/media/resolve-image";

function brandName(b?: Partial<Brand> | null) {
  return b?.display_name || "Agency";
}

function splitBrand(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], rest: "" };
  return { first: parts[0], rest: parts.slice(1).join(" ") };
}

function footerBits(it: Itinerary, brand?: Partial<Brand> | null) {
  const contact = [brand?.website?.replace(/^https?:\/\//, ""), brand?.whatsapp]
    .filter(Boolean)
    .join(" · ");
  return {
    left: [it.client_name, (it.content as ItineraryContent)?.group]
      .filter(Boolean)
      .join(" · ") || it.title,
    mid: contact || brandName(brand),
  };
}

function stayLabel(s: ItineraryStay) {
  const hotel = s.hotels?.name || "Hotel";
  const room = s.rooms
    ? `${s.rooms.room_type} · Room ${s.rooms.room_number}`
    : "Room TBD";
  return `${hotel} · ${room}`;
}

function overnightForDay(day: number, stays: ItineraryStay[], fallback?: string) {
  const match = stays.find((s) => {
    if (s.day_from != null && s.day_to != null) {
      return day >= s.day_from && day <= s.day_to;
    }
    if (s.day_from != null) return day === s.day_from;
    return false;
  });
  if (match) return stayLabel(match);
  return fallback;
}

function PageChrome({
  brand,
  children,
  page,
  total,
  dark,
  it,
}: {
  brand?: Partial<Brand> | null;
  children: ReactNode;
  page: number;
  total: number;
  dark?: boolean;
  it: Itinerary;
}) {
  const { first, rest } = splitBrand(brandName(brand));
  const ft = footerBits(it, brand);
  return (
    <section className={`page ${dark ? "cover" : ""}`}>
      <header className="page-header">
        <div className="brand">
          {first} {rest ? <span>{rest}</span> : null}
        </div>
        <div className="meta">Private Tour Itinerary</div>
      </header>
      {children}
      <footer className="page-footer">
        <span className="ft-left">{ft.left}</span>
        <span className="ft-mid">{ft.mid}</span>
        <span className="ft-right">
          {String(page).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </footer>
    </section>
  );
}

export function ClassicLuxuryDocument({
  itinerary,
  brand,
  ops,
}: {
  itinerary: Itinerary;
  brand?: Partial<Brand> | null;
  ops?: ItineraryOpsBundle | null;
}) {
  const c = itinerary.content || {};
  const b = brand || itinerary.brand_snapshot;
  const days = c.days || [];
  const stays = ops?.stays || [];
  const hasStays = stays.length > 0;
  const hotelOptions = c.hotel_options ?? [];
  const hasCmpTable = hotelOptions.length > 1 && !hasStays;
  const hotelPhotoOption = hotelOptions.find((o) => o.image_urls?.length) ?? hotelOptions.find((o) => o.recommended);
  const hasHotelPhotos = Boolean(hotelPhotoOption?.image_urls?.length);
  const hasClosing =
    Boolean(c.closing?.dos?.length) ||
    Boolean(c.closing?.donts?.length) ||
    Boolean(c.closing?.docs?.length) ||
    Boolean(c.closing?.packing?.length) ||
    Boolean(c.closing?.validity) ||
    Boolean(c.closing?.per_head?.length);
  const hotelSubtotal = stays.reduce((a, s) => a + (Number(s.rate) || 0), 0);
  const totalPages =
    4 +
    (hasCmpTable ? 1 : 0) +
    (hasHotelPhotos ? 1 : 0) +
    (hasStays ? 1 : 0) +
    (hotelOptions.length && !hasStays && !hasCmpTable ? 1 : 0) +
    (hasClosing ? 1 : 0) +
    Math.max(1, days.length);
  let page = 1;
  const zh = itinerary.language === "zh";
  const { first, rest } = splitBrand(brandName(b));

  const guideStaff = ops?.staff.find((s) => s.role === "guide");
  const driverStaff = ops?.staff.find((s) => s.role === "driver");
  const guideName = guideStaff?.guides?.name || c.guide;
  const vehicleLabel =
    driverStaff?.drivers?.vehicle_type ||
    c.vehicle_type ||
    c.vehicle ||
    (zh ? "运营系统分配" : "Assigned in Ops");
  const selectedOptionId = c.selected_option_id;
  const coverSrc = resolveImage({ kind: "cover", explicit: c.cover_image ?? DEFAULT_COVER });
  const letterSrc = b?.letter_photo_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/${b.letter_photo_path}`
    : resolveImage({ kind: "letter", explicit: DEFAULT_SIGNATORY });

  return (
    <div className={zh ? "lang-zh doc-root" : "doc-root"}>
      <PageChrome it={itinerary} brand={b} page={page++} total={totalPages} dark>
        <div className="cover-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverSrc} alt="" />
        </div>
        <div className="page-body">
          <div className="cover-content">
            <p className="cover-eyebrow">{c.eyebrow || "Private Journey"}</p>
            <h1 className="cover-brand">
              {first} {rest ? <em>{rest}</em> : null}
            </h1>
            <p className="cover-title">{c.trip_title || itinerary.title}</p>
            <div className="cover-rule" />
            <p className="cover-client">{c.prepared_for || itinerary.client_name}</p>
            <div className="cover-details">
              {[
                ["Departing from", c.departing_from],
                ["Gateway", c.gateway],
                ["Group", c.group],
                ["Travel dates", c.travel_dates],
                ["Vehicle", vehicleLabel],
                ["Guide", guideName],
              ].map(([label, value]) =>
                value ? (
                  <div className="cover-detail" key={label as string}>
                    <label>{label as string}</label>
                    <p>{value as string}</p>
                  </div>
                ) : null,
              )}
            </div>
          </div>
        </div>
      </PageChrome>

      <PageChrome it={itinerary} brand={b} page={page++} total={totalPages}>
        <div className="page-body">
          <p className="section-label">{zh ? "信函" : "Correspondence"}</p>
          <h2 className="page-heading">{zh ? "欢迎函" : "A note of welcome"}</h2>
          <p className="page-sub">
            {zh ? `来自 ${brandName(b)} 的问候` : `Personal greeting from ${brandName(b)}`}
          </p>
          {c.letter?.date ? <p className="letter-date">{c.letter.date}</p> : null}
          {c.letter?.greeting ? (
            <p className="letter-greeting">{c.letter.greeting}</p>
          ) : null}
          <div className="letter-body">
            {(c.letter?.paragraphs || []).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {(c.closing?.includes_fit || []).length ? (
            <div className="fit-check" style={{ marginTop: "6mm" }}>
              <div className="closing-block dos">
                <h3>{zh ? "已覆盖" : "Covered"}</h3>
                <ul>
                  {(c.closing?.includes_fit || []).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
          <div className="letter-contact">
            {b?.website ? (
              <div>
                <label>{zh ? "网站" : "Website"}</label>
                <p>{b.website.replace(/^https?:\/\//, "")}</p>
              </div>
            ) : null}
            {b?.whatsapp ? (
              <div>
                <label>WhatsApp</label>
                <p>{b.whatsapp}</p>
              </div>
            ) : null}
            {c.prepared_for ? (
              <div>
                <label>{zh ? "贵宾" : "Prepared for"}</label>
                <p>{c.prepared_for}</p>
              </div>
            ) : null}
          </div>
          <div className="letter-sign">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="letter-photo" src={letterSrc} alt="" />
            <div>
              <p className="closing">{zh ? "此致" : "With warm regards,"}</p>
              <p className="name">{b?.signatory_names || brandName(b)}</p>
              <p className="role">
                {b?.signatory_title || brandName(b)}
                {b?.since_year ? ` · Since ${b.since_year}` : ""}
              </p>
            </div>
          </div>
        </div>
      </PageChrome>

      <PageChrome it={itinerary} brand={b} page={page++} total={totalPages}>
        <div className="page-body">
          <p className="section-label">{zh ? "投资" : "Investment"}</p>
          <h2 className="page-heading">{zh ? "行程报价" : "Tour pricing"}</h2>
          <p className="page-sub">{c.pricing?.note}</p>
          <div className="price-hero">
            <div>
              <p className="label">{zh ? "套餐总价" : "Total package price"}</p>
              <p className="amount">
                {c.pricing?.currency || "USD"}{" "}
                {c.pricing?.total != null ? c.pricing.total.toLocaleString() : "—"}
              </p>
            </div>
            <p className="note">{c.pricing?.note}</p>
          </div>
          {hasStays && hotelSubtotal > 0 ? (
            <div className="highlight-note" style={{ marginBottom: "4mm" }}>
              <strong>{zh ? "住宿小计（实时分配）" : "Accommodation (live stays)"}:</strong>{" "}
              USD {hotelSubtotal.toLocaleString()}
            </div>
          ) : null}
          <div className="price-grid">
            <div className="price-card">
              <p className="num">01 · Per person</p>
              <h3>{zh ? "单人套餐" : "Full tour package"}</h3>
              <p className="value">
                {c.pricing?.currency || "USD"}{" "}
                {c.pricing?.per_person != null
                  ? c.pricing.per_person.toLocaleString()
                  : "—"}
              </p>
            </div>
            <div className="price-card">
              <p className="num">02 · Group total</p>
              <h3>
                {c.pricing?.pax || 2} {zh ? "人" : "adults"}
              </h3>
              <p className="value">
                {c.pricing?.currency || "USD"}{" "}
                {c.pricing?.total != null ? c.pricing.total.toLocaleString() : "—"}
              </p>
            </div>
          </div>
          {c.pricing?.inclusions?.length ? (
            <div className="price-includes">
              <h4>{zh ? "包含" : "Inclusions"}</h4>
              <ul>
                {c.pricing.inclusions.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              {c.pricing.exclusions ? (
                <p className="price-note">{c.pricing.exclusions}</p>
              ) : null}
            </div>
          ) : null}
          {(c.vehicle_options?.length ?? 0) > 0 ? (
            <div className="price-includes" style={{ marginTop: "5mm" }}>
              <h4>{zh ? "车辆类别（示意）" : "Vehicle categories (indicative)"}</h4>
              <ul>
                {c.vehicle_options!.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </PageChrome>

      {hotelOptions.length > 0 && !hasStays && !hasCmpTable ? (
        <PageChrome it={itinerary} brand={b} page={page++} total={totalPages}>
          <div className="page-body">
            <p className="section-label">{zh ? "住宿选择" : "Hotel options"}</p>
            <h2 className="page-heading">
              {zh ? "三套方案 · 择一确认" : "Three options · select one to confirm"}
            </h2>
            <p className="page-sub">
              {zh
                ? "以下为根据您的路线与星级要求匹配的示意酒店。推荐项已标注。"
                : "Matched to your route and star preference. Recommended option highlighted."}
            </p>
            <div className="hotel-rows">
              {hotelOptions.map((opt) => {
                const isSelected = opt.id === selectedOptionId;
                const isRec = opt.recommended;
                return (
                  <div
                    className="hotel-row"
                    key={opt.id}
                    style={
                      isSelected || isRec
                        ? { borderLeft: "2pt solid var(--gold)", paddingLeft: "4mm" }
                        : undefined
                    }
                  >
                    <div className="hotel-row-main">
                      <strong>
                        {opt.label}
                        {isRec ? (zh ? " · 推荐" : " · Recommended") : ""}
                        {isSelected ? (zh ? " · 已选" : " · Selected") : ""}
                      </strong>
                      <br />
                      <span className="hotel-alt">
                        {opt.city} · {opt.hotel} · {opt.room} · {opt.nights}n
                      </span>
                    </div>
                    <div className="hotel-row-price">
                      {opt.currency} <strong>{opt.total_pp.toLocaleString()}</strong>
                      <span style={{ fontSize: "8pt", display: "block" }}>/ person</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </PageChrome>
      ) : null}

      {hasCmpTable ? (
        <PageChrome it={itinerary} brand={b} page={page++} total={totalPages}>
          <div className="page-body">
            <p className="section-label">{zh ? "方案对比" : "Easy compare"}</p>
            <h2 className="page-heading">
              {zh ? "多套方案 · 并排对比" : "Options · side by side"}
            </h2>
            <p className="simple-intro">
              {c.pricing?.note ||
                (zh
                  ? "以下为根据路线与星级匹配的示意报价，推荐项已标注。"
                  : "Matched to your route and star preference. Recommended option highlighted.")}
            </p>
            <table className="cmp-table">
              <thead>
                <tr>
                  <th />
                  {hotelOptions.map((opt) => (
                    <th
                      key={opt.id}
                      className={opt.recommended || opt.id === selectedOptionId ? "rec" : undefined}
                    >
                      {opt.label}
                      {opt.recommended ? (zh ? " ★" : " ★") : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    [zh ? "酒店" : "Hotel", (o: (typeof hotelOptions)[0]) => o.hotel],
                    [zh ? "城市" : "City", (o: (typeof hotelOptions)[0]) => o.city],
                    [zh ? "房型" : "Room", (o: (typeof hotelOptions)[0]) => o.room],
                    [zh ? "晚数" : "Nights", (o: (typeof hotelOptions)[0]) => `${o.nights}n`],
                    [
                      zh ? "人均价" : "Price (per person)",
                      (o: (typeof hotelOptions)[0]) =>
                        `${o.currency} ${o.total_pp.toLocaleString()}`,
                    ],
                  ] as const
                ).map(([label, fn]) => (
                  <tr key={label}>
                    <th>{label}</th>
                    {hotelOptions.map((opt) => (
                      <td
                        key={opt.id}
                        className={
                          opt.recommended || opt.id === selectedOptionId ? "rec" : undefined
                        }
                      >
                        {fn(opt)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {selectedOptionId ? (
              <p className="note-line">
                {zh ? "已选方案：" : "Selected: "}
                {hotelOptions.find((o) => o.id === selectedOptionId)?.label ?? selectedOptionId}
              </p>
            ) : null}
          </div>
        </PageChrome>
      ) : null}

      {hasHotelPhotos && hotelPhotoOption ? (
        <PageChrome it={itinerary} brand={b} page={page++} total={totalPages}>
          <div className="page-body">
            <p className="section-label">{zh ? "住宿 · 实景" : "Stay · with photographs"}</p>
            <h2 className="page-heading">
              {zh ? "推荐酒店 · 实景照片" : "Hotels · recommended stay"}
            </h2>
            <p className="page-sub">
              {zh
                ? "以下为推荐方案匹配的示意酒店与实景照片。"
                : "Photographs for the recommended hotel option."}
            </p>
            <div className="hotel-block">
              <div className="hotel-block-head">
                <h3>
                  {hotelPhotoOption.city} · {hotelPhotoOption.hotel}
                </h3>
                <span className="nights">
                  {hotelPhotoOption.nights}n · {hotelPhotoOption.room}
                </span>
              </div>
              <p className="hotel-block-meta">
                {hotelPhotoOption.label}
                {hotelPhotoOption.recommended ? (zh ? " · 推荐" : " · Recommended") : ""}
              </p>
              <div className="hotel-shots">
                {(hotelPhotoOption.image_urls ?? []).slice(0, 5).map((url, i) => (
                  <figure key={i}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resolveImage({ explicit: url, kind: "hotel" })} alt="" />
                    <figcaption>
                      {i === 0
                        ? zh
                          ? "外观"
                          : "Exterior"
                        : i === 1
                          ? zh
                            ? "客房"
                            : "Room"
                          : zh
                            ? "实景"
                            : "View"}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </PageChrome>
      ) : null}

      {hasStays ? (
        <PageChrome it={itinerary} brand={b} page={page++} total={totalPages}>
          <div className="page-body">
            <p className="section-label">{zh ? "住宿确认" : "Accommodation"}</p>
            <h2 className="page-heading">
              {zh ? "酒店 · 日期与房型" : "Hotels · dates & rooms"}
            </h2>
            <p className="page-sub">
              {zh
                ? "以下来自实时库存分配，非整机虚构名称。"
                : "Assigned from live inventory — not invented hotel names."}
            </p>
            <div className="hotel-rows">
              {stays.map((s) => {
                const hotel = s.hotels;
                const room = s.rooms;
                const dates =
                  [s.check_in, s.check_out].filter(Boolean).join(" → ") ||
                  (s.day_from != null
                    ? `D${s.day_from}${s.day_to != null ? `–D${s.day_to}` : ""}`
                    : "—");
                return (
                  <div className="hotel-row" key={s.id}>
                    <div className="hotel-row-main">
                      <strong>
                        {hotel?.city ? `${hotel.city} · ` : ""}
                        {hotel?.name || "Hotel"}
                      </strong>
                      <br />
                      <span className="hotel-alt">
                        {dates}
                        {room
                          ? ` · ${room.room_type} · #${room.room_number}`
                          : zh
                            ? " · 房号待定"
                            : " · room TBD"}
                        {hotel?.phone ? ` · ${hotel.phone}` : ""}
                        {s.notes ? ` · ${s.notes}` : ""}
                      </span>
                    </div>
                    <div className="hotel-row-price">
                      {s.rate != null ? (
                        <>
                          {s.currency} <strong>{Number(s.rate).toLocaleString()}</strong>
                        </>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {hotelSubtotal > 0 ? (
              <div className="price-hero" style={{ marginTop: "6mm" }}>
                <div>
                  <p className="label">{zh ? "住宿小计" : "Stay total"}</p>
                  <p className="amount">USD {hotelSubtotal.toLocaleString()}</p>
                </div>
              </div>
            ) : null}
          </div>
        </PageChrome>
      ) : null}

      <PageChrome it={itinerary} brand={b} page={page++} total={totalPages}>
        <div className="page-body">
          <p className="section-label">{zh ? "交通" : "Access"}</p>
          <h2 className="page-heading">{zh ? "建议航班" : "Recommended flights"}</h2>
          <p className="page-sub">{c.flights?.summary}</p>
          <div className="price-grid" style={{ marginBottom: "6mm" }}>
            {(c.flights?.legs || []).map((leg, i) => (
              <div className="price-card" key={i}>
                <p className="num">
                  {leg.direction} {leg.date || ""}
                </p>
                <h3>
                  {leg.from} → {leg.to}
                </h3>
                <p className="value" style={{ fontSize: "16pt" }}>
                  {[leg.airline, leg.flight_number].filter(Boolean).join(" ")}
                </p>
                <p className="hint">
                  {[leg.depart && `Dep ${leg.depart}`, leg.arrive && `Arr ${leg.arrive}`, leg.notes]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            ))}
          </div>
          {c.flights?.booking_notes?.length ? (
            <div className="price-includes">
              <h4>{zh ? "预订说明" : "Booking notes"}</h4>
              <ul>
                {c.flights.booking_notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </PageChrome>

      {days.map((d) => {
        const overnight = overnightForDay(d.day, stays, d.overnight);
        const heroSrc = resolveImage({
          explicit: d.hero_image ?? d.image,
          cityHint: d.route || d.title,
          kind: "day",
        });
        const actImages = d.activity_images ?? [];
        const showPhotos = Boolean(d.hero_image || d.image || actImages.length);
        return (
          <PageChrome key={d.day} it={itinerary} brand={b} page={page++} total={totalPages}>
            <div className="page-body day-page">
              <p className="section-label">
                {zh ? `第 ${d.day} 天` : `Day ${String(d.day).padStart(2, "0")}`}
              </p>
              <h2 className="day-route">{d.route || d.title}</h2>
              <div className="day-layout">
                <div className="day-left">
                  <p className="day-desc">{d.description}</p>
                  <ul className="day-activities">
                    {(d.activities || []).map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                  <dl className="day-meta">
                    {overnight ? (
                      <>
                        <dt>{zh ? "住宿" : "Overnight"}</dt>
                        <dd>{overnight}</dd>
                      </>
                    ) : null}
                    {d.meals ? (
                      <>
                        <dt>{zh ? "餐食" : "Meals"}</dt>
                        <dd>{d.meals}</dd>
                      </>
                    ) : null}
                  </dl>
                </div>
                {showPhotos ? (
                  <div className="day-right">
                    <div className="day-loc">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={heroSrc} alt="" />
                      <span>{d.route || d.title}</span>
                    </div>
                    {actImages.length ? (
                      <div className="day-acts">
                        {actImages.slice(0, 4).map((img, i) => (
                          <figure key={i}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.url} alt="" />
                            {img.caption ? <figcaption>{img.caption}</figcaption> : null}
                          </figure>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {d.photo_notes ? (
                <div className="day-photo">
                  <h4>{zh ? "摄影提示" : "Photo notes"}</h4>
                  <p>{d.photo_notes}</p>
                </div>
              ) : null}
            </div>
          </PageChrome>
        );
      })}

      {hasClosing ? (
        <PageChrome it={itinerary} brand={b} page={page++} total={totalPages}>
          <div className="page-body">
            <p className="section-label">{zh ? "行前须知" : "Before you travel"}</p>
            <h2 className="page-heading">{zh ? "要点与礼仪" : "Essentials & etiquette"}</h2>
            <p className="page-sub">
              {zh
                ? "注意事项、证件、有效期与打包清单。"
                : "Dos & don'ts, documents, validity, and packing."}
            </p>

            {(c.closing?.dos?.length || c.closing?.donts?.length) ? (
              <div className="closing-grid">
                {c.closing?.dos?.length ? (
                  <div className="closing-block dos">
                    <h3>{zh ? "建议" : "Dos"}</h3>
                    <ul>
                      {c.closing.dos.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {c.closing?.donts?.length ? (
                  <div className="closing-block">
                    <h3>{zh ? "避免" : "Don'ts"}</h3>
                    <ul>
                      {c.closing.donts.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            {(c.closing?.docs?.length || c.closing?.packing?.length) ? (
              <div className="docs-row">
                {c.closing?.docs?.length ? (
                  <div className="closing-block">
                    <h3>{zh ? "所需证件" : "Documents required"}</h3>
                    <ul>
                      {c.closing.docs.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {c.closing?.packing?.length ? (
                  <div className="closing-block">
                    <h3>{zh ? "打包清单" : "Packing checklist"}</h3>
                    <ul>
                      {c.closing.packing.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            {c.closing?.per_head?.length ? (
              <div className="per-head">
                {c.closing.per_head.map((row, i) => (
                  <div className="per-head-item" key={i}>
                    <label>{row.label}</label>
                    <p className="value">{row.amount}</p>
                    {row.note ? <p className="sub">{row.note}</p> : null}
                  </div>
                ))}
              </div>
            ) : null}

            {c.closing?.validity ? (
              <div className="validity-box">
                <div>
                  <p className="v-label">{zh ? "报价有效期" : "Quote validity"}</p>
                  <p className="v-text">{c.closing.validity}</p>
                </div>
                <p className="v-side">
                  {b?.whatsapp
                    ? `${zh ? "WhatsApp" : "WhatsApp"} ${b.whatsapp}`
                    : brandName(b)}
                </p>
              </div>
            ) : null}
          </div>
        </PageChrome>
      ) : null}
    </div>
  );
}

export function collectClassicLuxuryImageUrls(
  itinerary: Itinerary,
  brand?: Partial<Brand> | null,
): string[] {
  const c = itinerary.content || {};
  const b = brand || itinerary.brand_snapshot;
  const coverSrc = resolveImage({ kind: "cover", explicit: c.cover_image ?? DEFAULT_COVER });
  const letterSrc = b?.letter_photo_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/${b.letter_photo_path}`
    : resolveImage({ kind: "letter", explicit: DEFAULT_SIGNATORY });
  const hotelUrls =
    c.hotel_options?.flatMap((o) => o.image_urls ?? []) ??
    [];
  return collectDocumentImageUrls({
    coverSrc,
    letterSrc,
    days: c.days,
    hotelImageUrls: [
      ...hotelUrls,
      c.guide_image,
      c.vehicle_image,
    ].filter(Boolean) as string[],
  });
}
