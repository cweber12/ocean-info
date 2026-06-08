import { beachDayActivity } from "./beach-day";
import { diveActivity } from "./dive";
import { sailActivity } from "./sail";
import { supKayakActivity } from "./sup-kayak";
import { surfActivity } from "./surf";
import { tidepoolsActivity } from "./tidepools";

export const activityDefinitions = [
  diveActivity,
  surfActivity,
  tidepoolsActivity,
  beachDayActivity,
  sailActivity,
  supKayakActivity,
];

export type { ActivityDataNeed, ActivityDefinition, ActivityId } from "./types";
