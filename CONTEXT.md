# Ocean Planner

Ocean Planner is a static planning app for comparing Southern California ocean conditions by activity, location, and date. This glossary defines the water-quality terms the app uses so source-specific data stays understandable without collapsing unlike concepts together.

## Language

**Water quality section**:
The single UI module that groups all water-quality information for a selected location and date. It contains distinct subsections for advisory status, discrete samples, and near-real-time sensor context rather than blending them into one undifferentiated feed.
_Avoid_: Unified feed, blended water status

**County advisory**:
The official beach safety or closure status published by a county or local authority. It is the authoritative status signal and is not interchangeable with sample or sensor context.
_Avoid_: Live sample status, sensor advisory

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
