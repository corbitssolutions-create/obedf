"use client";

import CreateManifestPage from "@/components/manifests/create-mani";

export default function CollectionManifestPage() {
  return (
    <CreateManifestPage
      title="Collection Manifest"
      subtitle="Create and load waybills and parcels onto collection manifests for pickup runs."
      onBack={() => {}}
      onSubmit={() => {}}
      waybillPool={[
        { id: "WB00012345", receiver: "Jet Park DC", parcels: 25, weight: 50.4, sender: "Makro (Pty) Ltd" },
        { id: "WB00012346", receiver: "Cape Town DC", parcels: 18, weight: 25.2, sender: "Builders Warehouse" },
        { id: "WB00012347", receiver: "Durban DC", parcels: 12, weight: 12.8, sender: "Takealot" },
        { id: "WB00012348", receiver: "Bloemfontein DC", parcels: 10, weight: 9.2, sender: "Pick n Pay DC" },
        { id: "WB00012349", receiver: "Polokwane DC", parcels: 15, weight: 0, sender: "Clicks DC" },
      ]}
    />
  );
}

