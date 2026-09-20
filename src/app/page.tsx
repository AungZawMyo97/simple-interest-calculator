import { Calculator } from "@/presentation/calculator";
import { currentMyanmarDate } from "@/infrastructure/myanmar-calendar";

// Derive the default borrowing date at request time, not at build time.
export const dynamic = "force-dynamic";

export default function Home() {
  const initialDate = currentMyanmarDate(new Date());
  return (
    <main className="site-shell">
      <header className="page-heading">
        <h1>Simple Interest Calculator</h1>
        <p>Monthly interest in MMK, using the Myanmar calendar.</p>
      </header>
      <Calculator initialDate={initialDate} />
      <p className="privacy-note">Your entries stay in this browser and aren’t saved.</p>
    </main>
  );
}
