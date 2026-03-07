import Dashboard from "@/components/Dashboard";

export const metadata = {
  title: "Dashboard | Blink Bounties",
};

export default function DashboardPage() {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1 style={{ marginBottom: "0.25rem" }}>My Bounties</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            All bounties you have created. Approve submissions or cancel to
            reclaim funds.
          </p>
        </div>
      </div>

      <Dashboard />
    </div>
  );
}
