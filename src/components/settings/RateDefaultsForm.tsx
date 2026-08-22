import { DEFAULT_RATE_DEFAULTS, type AgencyRateDefaults } from "@/lib/agency/rate-defaults";
import { saveRateDefaults } from "@/app/actions/agency";

export function RateDefaultsForm({
  defaults,
  disabled,
}: {
  defaults: AgencyRateDefaults;
  disabled?: boolean;
}) {
  const vehicles = defaults.vehicle_rates ?? DEFAULT_RATE_DEFAULTS.vehicle_rates ?? [];
  const rooms = defaults.room_category_rates ?? DEFAULT_RATE_DEFAULTS.room_category_rates ?? [];

  return (
    <form action={saveRateDefaults} className="form-stack">
      <fieldset disabled={disabled} style={{ border: 0, padding: 0, margin: 0 }}>
        <p className="field-hint" style={{ marginBottom: "0.75rem" }}>
          These rates drive proposal cards and PDF vehicle line. Hotel options still come from your live catalog;
          room categories below are your reference tariffs for desk.
        </p>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="guide_day_rate_usd">Guide · USD / day</label>
            <input
              className="input"
              id="guide_day_rate_usd"
              name="guide_day_rate_usd"
              type="number"
              defaultValue={defaults.guide_day_rate_usd ?? 85}
            />
          </div>
          <div className="field">
            <label htmlFor="car_day_rate_usd">Default car · USD / day (pricing)</label>
            <input
              className="input"
              id="car_day_rate_usd"
              name="car_day_rate_usd"
              type="number"
              defaultValue={defaults.car_day_rate_usd ?? 235}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="default_vehicle_type">Vehicle on client PDF cover</label>
          <input
            className="input"
            id="default_vehicle_type"
            name="default_vehicle_type"
            defaultValue={defaults.default_vehicle_type ?? ""}
            placeholder="Private SUV · Hyundai Santa Fe or similar"
          />
        </div>

        <p className="section-title" style={{ marginTop: "1rem", fontSize: "0.95rem" }}>
          Car categories (shown on PDF)
        </p>
        {vehicles.map((v, i) => (
          <div className="grid-2" key={i}>
            <div className="field">
              <label>Category</label>
              <input className="input" name="vehicle_category" defaultValue={v.category} />
            </div>
            <div className="field">
              <label>USD / day</label>
              <input className="input" name="vehicle_day_rate" type="number" defaultValue={v.day_rate_usd} />
            </div>
          </div>
        ))}
        <div className="grid-2">
          <div className="field">
            <input className="input" name="vehicle_category" placeholder="Add category…" />
          </div>
          <div className="field">
            <input className="input" name="vehicle_day_rate" type="number" placeholder="USD / day" />
          </div>
        </div>

        <p className="section-title" style={{ marginTop: "1rem", fontSize: "0.95rem" }}>
          Room category reference (USD net / night)
        </p>
        {rooms.map((r, i) => (
          <div className="grid-2" key={i} style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}>
            <div className="field">
              <label>Label</label>
              <input className="input" name="room_label" defaultValue={r.label} />
            </div>
            <div className="field">
              <label>Star</label>
              <input className="input" name="room_star" type="number" defaultValue={r.star} />
            </div>
            <div className="field">
              <label>Meal</label>
              <input className="input" name="room_meal" defaultValue={r.meal} />
            </div>
            <div className="field">
              <label>Net USD</label>
              <input className="input" name="room_net_usd" type="number" defaultValue={r.net_usd} />
            </div>
          </div>
        ))}

        {!disabled ? (
          <button type="submit" className="btn btn-secondary">
            Save rates & vehicle
          </button>
        ) : null}
      </fieldset>
    </form>
  );
}
