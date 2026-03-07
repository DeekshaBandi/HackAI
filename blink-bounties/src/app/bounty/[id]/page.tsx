import BountyDetail from "@/components/BountyDetail";

export const metadata = {
  title: "Bounty | Blink Bounties",
};

export default function BountyPage({ params }: { params: { id: string } }) {
  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <BountyDetail bountyId={params.id} />
    </div>
  );
}
