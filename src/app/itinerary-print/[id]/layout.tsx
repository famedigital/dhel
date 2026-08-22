import "./print.css";

export default function ItineraryPrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="itinerary-print-root itinerary-sheet">{children}</div>;
}
