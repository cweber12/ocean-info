import type { ActivityDataNeed, ActivityId } from "../activities";

export type SuitabilityTone = "great" | "good" | "watch" | "avoid";

export interface BestWindow {
  label: string;
  reason: string;
}

export interface ConditionSummary {
  id: ActivityDataNeed;
  label: string;
  value: string;
  tone: SuitabilityTone;
  note: string;
}

export interface CautionSummary {
  tone: SuitabilityTone;
  label: string;
  message: string;
}

export interface SourceSummary {
  label: string;
  sourceName: string;
  status: "placeholder" | "planned" | "public-api";
}

export interface PlannerActivityContent {
  activityId: ActivityId;
  recommendation: {
    label: string;
    summary: string;
    tone: SuitabilityTone;
  };
  bestWindow: BestWindow;
  conditions: ConditionSummary[];
  caution: CautionSummary;
  whatToNotice: string[];
  sources: SourceSummary[];
}

export const plannerContentByActivity: Record<ActivityId, PlannerActivityContent> = {
  "beach-day": {
    activityId: "beach-day",
    recommendation: {
      label: "Easy beach day",
      summary: "A gentle morning plan with warm layers, simple water checks, and time for shoreline exploring.",
      tone: "good",
    },
    bestWindow: {
      label: "9:30 AM - 12:30 PM",
      reason: "Morning light keeps the beach comfortable before afternoon wind becomes noticeable.",
    },
    conditions: [
      {
        id: "weather",
        label: "Sky",
        value: "Mild morning",
        tone: "good",
        note: "Comfortable for sand play, reading, and a picnic setup.",
      },
      {
        id: "water-quality",
        label: "Water quality",
        value: "Check advisory",
        tone: "watch",
        note: "Confirm local beach advisories before kids play near runoff zones.",
      },
      {
        id: "water-temperature",
        label: "Water feel",
        value: "Cool splash",
        tone: "good",
        note: "Good for feet-in-the-water play; bring dry layers for longer stays.",
      },
      {
        id: "tide",
        label: "Shoreline",
        value: "Room to roam",
        tone: "good",
        note: "Enough beach space for walking and shell spotting.",
      },
    ],
    caution: {
      tone: "watch",
      label: "Morning is friendliest",
      message: "Plan water play earlier and re-check water quality if rain or runoff has been recent.",
    },
    whatToNotice: [
      "Look for strand lines where seaweed and shells mark the last high tide.",
      "Compare wet and dry sand temperatures with bare feet.",
      "Watch how shorebirds move as people and waves shift around them.",
    ],
    sources: [
      { label: "Forecast", sourceName: "National Weather Service", status: "planned" },
      { label: "Advisories", sourceName: "County beach water quality feeds", status: "planned" },
      { label: "Tide", sourceName: "NOAA CO-OPS", status: "planned" },
    ],
  },
  dive: {
    activityId: "dive",
    recommendation: {
      label: "Check visibility first",
      summary: "Promising if swell stays low and recent water-quality checks are clear.",
      tone: "watch",
    },
    bestWindow: {
      label: "7:00 AM - 10:00 AM",
      reason: "Early conditions usually offer calmer wind and cleaner surface texture for shore entries.",
    },
    conditions: [
      {
        id: "swell",
        label: "Surface",
        value: "Small but verify",
        tone: "watch",
        note: "Low swell supports easier entries, but local surge can still vary by cove.",
      },
      {
        id: "water-temperature",
        label: "Temperature",
        value: "Wetsuit day",
        tone: "good",
        note: "Expect cool water and plan exposure protection accordingly.",
      },
      {
        id: "water-quality",
        label: "Water quality",
        value: "Confirm clear",
        tone: "watch",
        note: "Do not dive through posted advisories or after runoff events.",
      },
      {
        id: "marine-life",
        label: "Marine life",
        value: "Kelp edge watch",
        tone: "good",
        note: "Look for activity where kelp, reef, and sand meet.",
      },
    ],
    caution: {
      tone: "watch",
      label: "Local entry matters",
      message: "Use this as a planning cue, then verify surf, surge, and posted conditions at the exact entry.",
    },
    whatToNotice: [
      "Notice how kelp blades point with current near the surface.",
      "Watch for fish sheltering where reef relief changes.",
      "Compare surface texture with underwater visibility after entry.",
    ],
    sources: [
      { label: "Buoy and swell", sourceName: "NDBC", status: "planned" },
      { label: "Water temperature", sourceName: "NOAA CO-OPS / NDBC", status: "planned" },
      { label: "Advisories", sourceName: "County beach water quality feeds", status: "planned" },
    ],
  },
  sail: {
    activityId: "sail",
    recommendation: {
      label: "Watch the afternoon breeze",
      summary: "A light morning sail looks approachable, with more active wind likely later.",
      tone: "good",
    },
    bestWindow: {
      label: "10:00 AM - 1:00 PM",
      reason: "This window balances usable wind with a calmer sea state before afternoon texture builds.",
    },
    conditions: [
      {
        id: "wind",
        label: "Wind",
        value: "Building",
        tone: "good",
        note: "Enough breeze to move, with a later-day increase to monitor.",
      },
      {
        id: "weather",
        label: "Forecast",
        value: "Settled",
        tone: "good",
        note: "Good for relaxed planning if marine-layer changes stay mild.",
      },
      {
        id: "swell",
        label: "Sea state",
        value: "Light texture",
        tone: "good",
        note: "Manageable for nearshore sailing when wind and swell are aligned.",
      },
      {
        id: "tide",
        label: "Harbor timing",
        value: "Check current",
        tone: "watch",
        note: "Confirm harbor entrance and channel current timing before launch.",
      },
    ],
    caution: {
      tone: "watch",
      label: "Re-check wind before launch",
      message: "If gusts arrive early, choose a shorter route or keep the plan inside protected water.",
    },
    whatToNotice: [
      "Watch for darker patches on the water where wind is filling in.",
      "Compare flag movement on land with ripples offshore.",
      "Notice how current changes near harbor mouths and channels.",
    ],
    sources: [
      { label: "Marine forecast", sourceName: "National Weather Service", status: "planned" },
      { label: "Buoy observations", sourceName: "NDBC", status: "planned" },
      { label: "Tide/current timing", sourceName: "NOAA CO-OPS", status: "planned" },
    ],
  },
  "sup-kayak": {
    activityId: "sup-kayak",
    recommendation: {
      label: "Start early and stay tucked in",
      summary: "Best for a protected morning paddle before wind adds chop.",
      tone: "good",
    },
    bestWindow: {
      label: "8:00 AM - 11:00 AM",
      reason: "Morning wind is usually lighter, making balance and return paddling easier.",
    },
    conditions: [
      {
        id: "wind",
        label: "Wind",
        value: "Light early",
        tone: "good",
        note: "Early paddles are usually smoother and less tiring.",
      },
      {
        id: "water-quality",
        label: "Water quality",
        value: "Check launch",
        tone: "watch",
        note: "Protected launches can hold runoff longer than exposed beaches.",
      },
      {
        id: "tide",
        label: "Tide movement",
        value: "Gentle current",
        tone: "good",
        note: "Plan the return leg with current and wind in mind.",
      },
      {
        id: "weather",
        label: "Comfort",
        value: "Layered start",
        tone: "good",
        note: "Bring a light layer for the first half hour on the water.",
      },
    ],
    caution: {
      tone: "watch",
      label: "Wind decides the route",
      message: "Choose a turnaround point before launching and avoid paddling downwind first.",
    },
    whatToNotice: [
      "Watch how ripples change near points, bridges, and moored boats.",
      "Look for eelgrass or kelp beds as habitat edges.",
      "Notice how the moon phase relates to stronger or gentler tide movement.",
    ],
    sources: [
      { label: "Wind forecast", sourceName: "National Weather Service", status: "planned" },
      { label: "Tide", sourceName: "NOAA CO-OPS", status: "planned" },
      { label: "Water quality", sourceName: "County beach water quality feeds", status: "planned" },
    ],
  },
  surf: {
    activityId: "surf",
    recommendation: {
      label: "Soft learner-friendly window",
      summary: "Good for a mellow session if wind stays light and beach advisories are clear.",
      tone: "good",
    },
    bestWindow: {
      label: "7:30 AM - 10:30 AM",
      reason: "Morning wind often keeps the surface cleaner before afternoon texture arrives.",
    },
    conditions: [
      {
        id: "swell",
        label: "Swell",
        value: "Small lines",
        tone: "good",
        note: "Friendly size for longboards, learners, and playful shore watching.",
      },
      {
        id: "wind",
        label: "Wind",
        value: "Light early",
        tone: "good",
        note: "Cleaner faces are most likely before the sea breeze fills in.",
      },
      {
        id: "tide",
        label: "Tide",
        value: "Mid-tide check",
        tone: "watch",
        note: "Some beaches work better before the tide gets too full or too drained.",
      },
      {
        id: "water-temperature",
        label: "Water feel",
        value: "Cool",
        tone: "good",
        note: "Expect a comfortable session with the right suit.",
      },
    ],
    caution: {
      tone: "watch",
      label: "Beach shape matters",
      message: "Use the forecast as a guide, then check the actual sandbar and crowd before paddling out.",
    },
    whatToNotice: [
      "Count how many waves arrive in a set before the lull.",
      "Watch whether wind is grooming or crumbling the wave faces.",
      "Notice how tide changes where waves break on the sandbar.",
    ],
    sources: [
      { label: "Buoy swell", sourceName: "NDBC", status: "planned" },
      { label: "Wind forecast", sourceName: "National Weather Service", status: "planned" },
      { label: "Tide", sourceName: "NOAA CO-OPS", status: "planned" },
    ],
  },
  tidepools: {
    activityId: "tidepools",
    recommendation: {
      label: "Best for curious exploring",
      summary: "A low-tide window makes this a strong choice for a gentle field-study outing.",
      tone: "great",
    },
    bestWindow: {
      label: "45 minutes before low tide to 45 minutes after",
      reason: "This gives the most exposed habitat while leaving time to exit before water rises.",
    },
    conditions: [
      {
        id: "tide",
        label: "Low tide",
        value: "Key window",
        tone: "great",
        note: "Plan around the lowest daylight tide and keep an eye on the return path.",
      },
      {
        id: "weather",
        label: "Comfort",
        value: "Light layers",
        tone: "good",
        note: "Cool mornings are comfortable if everyone has dry layers.",
      },
      {
        id: "marine-life",
        label: "What to see",
        value: "Look closely",
        tone: "great",
        note: "Small animals are easier to spot when everyone moves slowly.",
      },
      {
        id: "water-quality",
        label: "Advisory",
        value: "Check before touching",
        tone: "watch",
        note: "Avoid touching water after runoff or posted advisories.",
      },
    ],
    caution: {
      tone: "good",
      label: "Move gently",
      message: "Watch footing, keep hands out of holes, and leave animals attached where they are.",
    },
    whatToNotice: [
      "Find the splash zone, high tide zone, and low tide zone by looking at where organisms live.",
      "Look for animals that close up when exposed to air.",
      "Notice how the moon and tide timing shape when the pools are visible.",
    ],
    sources: [
      { label: "Tide predictions", sourceName: "NOAA CO-OPS", status: "planned" },
      { label: "Weather forecast", sourceName: "National Weather Service", status: "planned" },
      { label: "Marine life context", sourceName: "Public field-guide and seasonal references", status: "placeholder" },
    ],
  },
};

export function getPlannerContent(activityId: ActivityId): PlannerActivityContent {
  return plannerContentByActivity[activityId];
}
