import { Suspense } from "react";

import HostPanelClient from "./host-client";

export default function HostPanelPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading...</p>}>
      <HostPanelClient />
    </Suspense>
  );
}
