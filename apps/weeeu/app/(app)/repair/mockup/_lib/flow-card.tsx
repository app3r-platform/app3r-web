// ── Shared components for Repair Module Mockup (P2 · HUB Gen 52) ─────────────
// FlowCard: renders one step in a cross-app case flow
// XAppView: §8 cross-app annotation
// Used by: c1-walkin, c2-pickup, c3-parcel, c4-scrap, c5-reprice, c6-onsite,
//          c7-cancel, c8-abandoned, c9-dispute, c10-b1reject, m5-hybrid-b
// ─────────────────────────────────────────────────────────────────────────────

export type XApp = {
  actor: string;
  id: string;
  name: string;
  route: string;
  port: number;
};

export type FlowCardProps = {
  step: number;
  actorLabel: string;
  actorCls: string;
  screenId: string;
  screenName: string;
  route: string;
  port: number;
  action: string;
  stateAfter: string;
  navTo?: string;
  xapp?: XApp[];
  tier1?: string[];
};

export function FlowCard({
  step, actorLabel, actorCls, screenId, screenName, route, port,
  action, stateAfter, navTo, xapp, tier1,
}: FlowCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start gap-4">
        {/* Step number */}
        <div className="w-8 h-8 bg-weeeu-primary text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
          {step}
        </div>
        <div className="flex-1 space-y-2">
          {/* Actor badge + Screen ID + link */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${actorCls}`}>{actorLabel}</span>
            <code className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">{screenId}</code>
            <a
              href={`http://localhost:${port}${route}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-weeeu-primary underline font-medium"
            >
              {screenName}
            </a>
          </div>

          {/* Action description */}
          <p className="text-sm text-gray-700">{action}</p>

          {/* State after */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">State after:</span>
            <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{stateAfter}</span>
          </div>

          {/* §6 nav annotation */}
          {navTo && (
            <div className="mock-anno mock-anno-nav">
              §6 nav: → <code>{navTo}</code>
            </div>
          )}

          {/* §8 cross-app annotation */}
          {xapp && xapp.length > 0 && (
            <div className="mock-anno mock-anno-xapp">
              <p className="font-semibold mb-1">§8 👁 แอพฯอื่น ณ จังหวะนี้:</p>
              <ul className="space-y-0.5">
                {xapp.map((x, i) => (
                  <li key={i}>
                    <span className="opacity-70">{x.actor}:</span>{" "}
                    <a href={`http://localhost:${x.port}${x.route}`} target="_blank" rel="noopener noreferrer">
                      <code>{x.id}</code> {x.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tier-1 lens check at this step */}
          {tier1 && tier1.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
              <p className="text-[10px] font-bold text-amber-700 uppercase mb-1">🎯 Lens:</p>
              {tier1.map((l, i) => (
                <p key={i} className="text-[10px] text-amber-600">• {l}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
