# Ocean Planner

Ocean Planner is a static planning app for comparing Southern California ocean conditions by activity, location, and date. This glossary defines the water-quality terms the app uses so source-specific data stays understandable without collapsing unlike concepts together.

## Language

**Water quality section**:
The single UI module that groups all water-quality information for a selected location and date. It contains distinct subsections for advisory status, discrete samples, and near-real-time sensor context rather than blending them into one undifferentiated feed.
_Avoid_: Unified feed, blended water status

**User-first heading**:
A subsection heading written in terms of the user's decision or the kind of evidence shown, not the upstream provider name. Source names should appear as supporting provenance labels rather than lead the section hierarchy.
_Avoid_: Source-first heading, provider-first title

**Provenance note**:
A lightweight line of source context that explains where a sample or observation came from without occupying a primary summary slot. Provenance supports trust and interpretation but should stay visually subordinate to current conditions and official status.
_Avoid_: Primary stat, headline metric

**County advisory**:
The official beach safety or closure status published by a county or local authority. It is the authoritative status signal and is not interchangeable with sample or sensor context, and when live integration is unavailable the UI should direct the user to the official advisory source.
_Avoid_: Live sample status, sensor advisory

**County advisory site mapping**:
The stable link between a curated Ocean Planner location and the official county beach/site record used for advisory status. It should be explicit and curated rather than inferred from display names at runtime.
_Avoid_: Beach name guess, fuzzy county match

**Primary county status**:
The single official county advisory state shown for the selected location after applying source-defined severity and recency rules. It is the planner-facing answer, distinct from the underlying county event records that support it.
_Avoid_: Event list, blended advisory detail

**County event**:
An individual official county advisory, warning, or closure record attached to one or more county sites. County events support the primary county status but should remain separate from the summary status contract.
_Avoid_: Summary status, live sample

**WQP sample**:
A discrete water-quality sample from the Water Quality Portal. It is dated laboratory or field sample evidence, not a live beach status feed.
_Avoid_: Live reading, advisory status

**WQP bacteria samples**:
The subset of WQP samples used as recent microbial safety context, such as Enterococcus, E. coli, and coliform measurements. They should be presented separately from chemistry samples because they carry different safety meaning.
_Avoid_: General recent samples, live advisory

**WQP chemistry samples**:
The subset of WQP samples used as broader water-condition context, separate from microbial safety evidence. They support interpretation but should not visually compete with bacteria samples for safety status.
_Avoid_: Bacteria status, advisory feed

**SCCOOS observation**:
A near-real-time ocean sensor observation from the SCCOOS Scripps Pier station. It provides environmental context and is not a substitute for beach-specific advisory status.
_Avoid_: Beach closure status, county advisory
