"use client";

import ManifestDetailPage from "@/components/manifests/manifest-detail";

export default function CollectionDebriefPage() {
  return (
    <ManifestDetailPage
      title="Collection Manifest Debrief"
      subtitle="Scan waybills and parcels collected from customers to debrief collection runs."
      manifestNo="CM00012345"
      manifestId="CM00012345"
      onBack={() => {}}
    />
  );
}

