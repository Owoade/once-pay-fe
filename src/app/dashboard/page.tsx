// Server segment module — opts the auth-gated client view out of
// instant-navigation validation (the shell renders nothing until the
// localStorage token check resolves).
export const instant = false;

import OverviewClientView from "./overview-view";

export default function OverviewPage() {
  return <OverviewClientView />;
}