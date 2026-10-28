# Design system

AgentCore AI uses the supplied neon SaaS references as direction for real components: navy backgrounds, layered graphite surfaces, violet-to-blue actions, cyan activity accents and semantic status colors. References are not used as interface backgrounds.

`frontend/src/styles/tokens.css` centralizes the palette and existing aliases. `premium.css` imports five ordered section stylesheets for foundations, authentication, workflow studio, monitoring and responsive behavior. Legacy global CSS supplies base layout rules. Geist and Geist Mono are served locally from `public/fonts`. Headings, labels, numeric KPIs and diagnostic JSON have separate typography roles.

Authentication uses a split layout with a CSS orbital sculpture, labeled fields, password visibility, validation and submission feedback. Authenticated pages share navigation, organization settings, recent audit events, account controls and a saved higher-contrast preference. Builder pages use a compact desktop sidebar for more canvas space.

Reusable Recharts components display existing API data. Trend charts appear only with recorded history; comparison scope is stated explicitly. Missing records use empty states. Unsupported social login, provider configuration and organization switching are not presented as working actions.

The workflow studio separates node cards, searchable library, graph history and execution presentation. Emerald triggers, violet agents, blue tools, amber conditions, rose delays, pink approvals and cyan outputs provide type cues. Selected nodes, missing agent assignments and execution status have distinct borders and labels. Only connections leading to running nodes animate. Desktop and tablet support editing; mobile offers a selectable node list with disabled configuration fields for inspection.

Run monitoring pairs a selectable timeline with Input, Output, Logs and Details tabs. Logs show persisted execution records. JSON display and clipboard copy redact credential-shaped fields. Dialogs support initial focus, Tab containment, Escape and focus restoration. Focus rings, pending states, feedback toasts, reduced-motion styles and responsive layouts are shared across screens. A comprehensive assistive-technology audit remains outside completed verification.
