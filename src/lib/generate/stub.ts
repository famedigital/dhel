import type { Brand, DayContent, ItineraryContent, ItineraryLanguage } from "@/lib/types";
import type { PackageOption } from "@/lib/catalog";
import { formatStayRoute, cityMatches, type StaySegment } from "@/lib/catalog/stay-plan";
import type { VehicleRateCategory } from "@/lib/agency/rate-defaults";

export type BuildStubContentOpts = {
  brief: string;
  clientName?: string | null;
  days: number;
  language: ItineraryLanguage;
  brand?: Brand | null;
  packageOption?: PackageOption;
  stayPlan?: StaySegment[];
  pax?: number;
  adults?: number;
  children?: number;
  entryPoint?: string;
  travelDates?: string;
  defaultVehicleType?: string;
  vehicleRates?: VehicleRateCategory[];
};

function formatGroup(
  language: ItineraryLanguage,
  adults?: number,
  children?: number,
  pax?: number,
): string {
  const a = adults ?? pax ?? 2;
  const c = children ?? 0;
  if (language === "zh") {
    return c > 0 ? `${a} 位成人 · ${c} 位儿童` : `${a} 位成人`;
  }
  return c > 0 ? `${a} Adults · ${c} Children` : `${a} Adult${a === 1 ? "" : "s"}`;
}

function gatewayForEntry(entryPoint?: string): string {
  const e = (entryPoint || "").toLowerCase();
  if (e.includes("bagdogra") || e.includes("hasimara")) return "Bagdogra (IXB) / Phuentsholing border";
  if (e.includes("phuentsholing") || e.includes("pling")) return "Phuentsholing border";
  if (e.includes("paro")) return "Paro International (PBH)";
  return "Paro International (PBH)";
}

function hotelForCity(
  city: string,
  packageOption?: PackageOption,
): string {
  const stays = packageOption?.hotel.stays;
  const stay = stays?.find((s) => cityMatches(s.city, city));
  if (stay) return `${stay.hotel_name} · ${stay.room_type}`;
  if (packageOption?.hotel.hotel_name) {
    return `${packageOption.hotel.hotel_name} · ${packageOption.hotel.room_type}`;
  }
  return "TBD overnight — assign in Ops";
}

function buildRouteDays(opts: BuildStubContentOpts, totalDays: number): DayContent[] {
  const stayPlan = opts.stayPlan;
  if (!stayPlan?.length) return [];

  const totalNights = stayPlan.reduce((n, s) => n + s.nights, 0);
  if (totalDays < totalNights) return [];

  const isZh = opts.language === "zh";
  const routeLabel = formatStayRoute(stayPlan);
  const result: DayContent[] = [];
  const first = stayPlan[0]!;

  result.push({
    day: 1,
    title: isZh ? `抵达 · ${first.city}` : `Arrival · ${first.city}`,
    route: opts.entryPoint
      ? `${opts.entryPoint} → ${first.city}`
      : isZh
        ? `入境 · ${first.city}`
        : `Entry · ${first.city}`,
    description: isZh
      ? `根据您的路线（${routeLabel}）安排入境与欢迎。`
      : `Arrival and welcome per your route: ${routeLabel}.`,
    activities: isZh
      ? ["边境/机场接送", "入住休息", "简报与行程确认"]
      : ["Border/airport transfer", "Check-in & rest", "Briefing"],
    overnight: hotelForCity(first.city, opts.packageOption),
    meals: isZh ? "晚" : "D",
  });

  let dayNum = 2;

  for (let si = 0; si < stayPlan.length; si++) {
    const seg = stayPlan[si]!;
    const nightsRemainingInSeg = seg.nights - (si === 0 ? 1 : 0);

    for (let n = 0; n < nightsRemainingInSeg; n++) {
      if (dayNum > totalDays - 1) break;
      const isTransfer = si > 0 && n === 0;
      result.push({
        day: dayNum,
        title: isTransfer
          ? isZh
            ? `前往 · ${seg.city}`
            : `Transfer · ${seg.city}`
          : isZh
            ? `${seg.city} · 探索`
            : `${seg.city} · Explore`,
        route: seg.city,
        description: isZh
          ? `${seg.city} · 路线 ${routeLabel}`
          : `${seg.city} · ${routeLabel}`,
        activities: isZh
          ? ["私家车", "向导陪同", "当地景点"]
          : ["Private vehicle", "Guided sightseeing", "Local highlights"],
        overnight: hotelForCity(seg.city, opts.packageOption),
        meals: isZh ? "早 / 午 / 晚" : "B / L / D",
      });
      dayNum++;
    }
  }

  if (dayNum <= totalDays) {
    const lastCity = stayPlan[stayPlan.length - 1]!.city;
    result.push({
      day: dayNum,
      title: isZh ? "返程" : "Departure",
      route: isZh ? `${lastCity} · 出境` : `${lastCity} · Exit`,
      description: isZh ? "送机/送边境，结束行程。" : "Transfer out — end of journey.",
      activities: isZh ? ["退房", "送机/送边境"] : ["Check-out", "Departure transfer"],
      overnight: "—",
      meals: isZh ? "早" : "B",
    });
  }

  return result.slice(0, totalDays);
}

export function buildStubClientReply(opts: {
  language: ItineraryLanguage;
  sellPerPerson: number;
  currency: string;
  days: number;
  brandName: string;
}): string {
  if (opts.language === "zh") {
    return `您好！感谢咨询不丹行程。${opts.brandName} 为您准备了 ${opts.days} 天陆地套餐示意报价，约 ${opts.currency} ${opts.sellPerPerson.toLocaleString()} / 人（不含国际机票）。如需调整日期或酒店，请随时告知。`;
  }
  return `Thank you for your enquiry! ${opts.brandName} has a ${opts.days}-day Bhutan land package from ${opts.currency} ${opts.sellPerPerson.toLocaleString()} per person (flights extra, indicative). Happy to refine dates or hotels — just say the word.`;
}

export function buildStubContent(opts: BuildStubContentOpts): ItineraryContent {
  const brandName = opts.brand?.display_name || "Your Agency";
  const client = opts.clientName || (opts.language === "zh" ? "尊贵宾客" : "Traveller");
  const days = Math.max(3, Math.min(opts.days || 7, 14));
  const routeDays = buildRouteDays(opts, days);

  const dayTitles =
    opts.language === "zh"
      ? ["抵达与迎宾", "首都文化", "山口与河谷", "要塞与桥梁", "徒步与寺院", "自由探索", "返程"]
      : [
          "Arrival & welcome",
          "Capital culture",
          "Passes & valleys",
          "Dzong & bridges",
          "Hike & monastery",
          "Leisure & crafts",
          "Departure",
        ];

  const genericDays = Array.from({ length: days }, (_, i) => {
    const title = dayTitles[i % dayTitles.length];
    return {
      day: i + 1,
      title,
      route:
        opts.language === "zh"
          ? `第 ${i + 1} 天 · 行程`
          : `Day ${i + 1} · Scenic circuit`,
      description:
        opts.language === "zh"
          ? `根据您的需求（${opts.brief.slice(0, 80)}…）生成的草案日。请在编辑器中细化活动与住宿。`
          : `Draft day shaped from your brief: “${opts.brief.slice(0, 100)}${opts.brief.length > 100 ? "…" : ""}”. Refine activities and hotels in the editor.`,
      activities:
        opts.language === "zh"
          ? ["私家车接送", "向导陪同参观", "当地风味体验"]
          : ["Private transfers", "Guided visit", "Local experience"],
      overnight:
        opts.language === "zh" ? "待运营分配住宿" : "TBD overnight — assign in Ops",
      meals: opts.language === "zh" ? "早 / 午 / 晚" : "B / L / D",
    };
  });

  return {
    eyebrow:
      opts.language === "zh"
        ? `不丹 · ${days} 天 · ${days - 1} 晚`
        : `Kingdom of Bhutan · ${days} Days · ${days - 1} Nights`,
    trip_title:
      opts.stayPlan?.length && opts.language === "zh"
        ? `${days} 日不丹 · ${formatStayRoute(opts.stayPlan)}`
        : opts.stayPlan?.length
          ? `${days}-Day Bhutan · ${formatStayRoute(opts.stayPlan)}`
          : opts.language === "zh"
            ? `${days} 日不丹私享之旅`
            : `${days}-Day Bhutan Journey`,
    prepared_for:
      opts.language === "zh" ? `专为 ${client} 准备` : `Prepared for ${client}`,
    departing_from: opts.entryPoint?.trim() || (opts.language === "zh" ? "待确认" : "To be confirmed"),
    gateway: gatewayForEntry(opts.entryPoint),
    group: formatGroup(opts.language, opts.adults, opts.children, opts.pax),
    travel_dates: opts.travelDates?.trim() || (opts.language === "zh" ? "日期待定" : "Dates flexible"),
    vehicle: opts.defaultVehicleType?.trim() || (opts.language === "zh" ? "运营系统分配" : "Assigned in Ops"),
    guide: opts.language === "zh" ? "运营系统分配" : "Assigned in Ops",
    letter: {
      date: new Date().toLocaleDateString(opts.language === "zh" ? "zh-CN" : "en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      greeting: opts.language === "zh" ? `尊敬的 ${client}，` : `Dear ${client},`,
      paragraphs:
        opts.language === "zh"
          ? [
              `感谢您的垂询。我们荣幸为您呈上这份由 ${brandName} 为您定制的不丹旅程草案。`,
              "本草案为示意草稿（系统生成或尚未配置 Gemini）。请完善日期、酒店与价格后发送给客人。",
              "如有任何调整，欢迎随时联系我们。",
            ]
          : [
              `Thank you for writing — it is our pleasure to present this private Bhutan itinerary prepared by ${brandName}.`,
              "The day-by-day plan below follows your brief. Hotels, guide, and vehicle will be confirmed in Ops before travel.",
              "We look forward to hosting you in the Land of the Thunder Dragon.",
            ],
    },
    pricing: opts.packageOption
      ? {
          currency: opts.packageOption.currency,
          total: opts.packageOption.sell_total,
          per_person: opts.packageOption.sell_per_person,
          pax: opts.pax ?? Math.round(opts.packageOption.sell_total / Math.max(opts.packageOption.sell_per_person, 1)),
          note:
            opts.language === "zh"
              ? "示意报价 · 以最终确认为准"
              : "Indicative package · subject to confirmation",
          inclusions:
            opts.language === "zh"
              ? ["可持续发展费（SDF）", "签证协助", "酒店", "私家车与向导", "景点门票", "接送"]
              : [
                  "Sustainable Development Fee (SDF) as applicable",
                  "Visa facilitation",
                  `${opts.packageOption.hotel.hotel_name} · ${opts.packageOption.hotel.room_type}`,
                  "Private car with driver · assigned in Ops",
                  "Licensed guide · assigned in Ops",
                  "Monument fees as per itinerary",
                  "Transfers as per itinerary",
                ],
          exclusions:
            opts.language === "zh"
              ? "国际机票、保险、个人消费、小费、酒水与未列明的餐食。"
              : "International flights, insurance, personal expenses, tips, beverages, and meals not specified.",
          flight_extra_note:
            opts.language === "zh"
              ? "往返机票另计 · 示意区间"
              : "Flights extra · indicative range",
        }
      : {
          currency: "USD",
          total: days * 480,
          per_person: days * 240,
          pax: opts.pax ?? 2,
          note:
            opts.language === "zh"
              ? "示意报价 · 以最终确认为准"
              : "Indicative package · subject to confirmation",
          inclusions:
            opts.language === "zh"
              ? ["可持续发展费（SDF）", "签证协助", "三星级酒店", "私家车与向导", "景点门票", "机场接送"]
              : [
                  "Sustainable Development Fee (SDF) as applicable",
                  "Visa facilitation",
                  "3-star hotels · assigned in Ops from live inventory",
                  "Private car with driver · assigned in Ops",
                  "Licensed guide · assigned in Ops",
                  "Monument fees as per itinerary",
                  "Airport transfers",
                ],
          exclusions:
            opts.language === "zh"
              ? "国际机票、保险、个人消费、小费、酒水与未列明的餐食。"
              : "International flights, insurance, personal expenses, tips, beverages, and meals not specified.",
          flight_extra_note:
            opts.language === "zh"
              ? "往返机票另计 · 示意区间"
              : "Flights extra · indicative range",
        },
    flights: {
      summary:
        opts.language === "zh"
          ? "建议航线示意 · 请以航空公司实时班期为准"
          : "Recommended access · confirm live schedules with airlines",
      legs: [
        {
          direction: "inbound",
          airline: "Drukair",
          flight_number: "KB401",
          from: "KTM",
          to: "PBH",
          notes: opts.language === "zh" ? "示意晨班" : "Indicative morning arrival",
        },
        {
          direction: "outbound",
          airline: "Drukair",
          flight_number: "KB400",
          from: "PBH",
          to: "KTM",
          notes: opts.language === "zh" ? "示意早班" : "Indicative early departure",
        },
      ],
      booking_notes:
        opts.language === "zh"
          ? ["机票不含在陆地套餐内", "帕罗为目视飞行机场，天气可能影响航班"]
          : [
              "Airfares are not included in the land package",
              "Paro is a visual-flight airport; weather can affect operations",
            ],
    },
    days: routeDays.length >= days ? routeDays : genericDays,
    vehicle_type: opts.defaultVehicleType?.trim(),
    closing: {
      notes:
        opts.language === "zh"
          ? ["草案仅供内部使用，发送前请人工审校。"]
          : ["Draft for internal review — please proof before client send."],
    },
  };
}
