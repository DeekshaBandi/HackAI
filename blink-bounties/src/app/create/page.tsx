import CreateBountyForm from "@/components/CreateBountyForm";

export const metadata = {
  title: "Create Bounty | Blink Bounties",
};

export default function CreatePage() {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ marginBottom: "0.25rem" }}>Create a Bounty</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
        Post a task and lock SOL as the reward. Share the resulting Blink URL
        anywhere to attract contributors.
      </p>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "2rem",
        }}
      >
        <CreateBountyForm />
      </div>
    </div>
  );
}
