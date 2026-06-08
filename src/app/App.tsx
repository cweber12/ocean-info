import { activityDefinitions } from "../activities";
import { coastalLocations } from "../locations/southern-california-coast";

export function App() {
  return (
    <main className="shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">San Diego to Oceanside</p>
          <h1>Ocean Info</h1>
        </div>
        <div className="status-pill">Static client</div>
      </header>

      <section className="control-strip" aria-label="Search filters">
        <label>
          Location
          <select defaultValue={coastalLocations[0]?.id}>
            {coastalLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date
          <input type="date" />
        </label>
      </section>

      <section className="activity-grid" aria-label="Ocean activities">
        {activityDefinitions.map((activity) => (
          <article className="activity-card" key={activity.id}>
            <p className="activity-type">{activity.dataNeeds.length} data groups</p>
            <h2>{activity.name}</h2>
            <p>{activity.summary}</p>
            <ul>
              {activity.dataNeeds.map((need) => (
                <li key={need}>{need}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
