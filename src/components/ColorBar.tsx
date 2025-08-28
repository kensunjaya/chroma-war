export default function ColorBar({
  turn,
  colorCount,
}: {
  turn: number;
  colorCount: { [key: string]: number };
}) {
  const total = colorCount["R"] + colorCount["B"];
  const blueWidth = turn < 2 ? 50 : (colorCount["B"] / total) * 100;
  const redWidth = turn < 2 ? 50 : (colorCount["R"] / total) * 100;

  return (
    <div className="flex h-[25px] bg-transparent mt-5">
      <div
        className="h-full bg-blue-400 transition-all"
        style={{
          width: `${blueWidth}%`,
          borderRight: `4px solid ${blueWidth !== 100 ? "var(--color-secondary)" : "transparent"}`,
        }}
      />
      <div
        className="h-full bg-red-400 transition-all"
        style={{
          width: `${redWidth}%`,
          borderLeft: `4px solid ${redWidth !== 100 ? "var(--color-secondary)" : "transparent"}`,
        }}
      />
    </div>
  );
}
