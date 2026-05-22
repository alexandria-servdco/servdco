import { ReactNode } from "react";

interface StatisticsCardProps {
  number: string;
  label: string;
  icon: ReactNode;
}

export default function StatisticsCard({ number, label, icon }: StatisticsCardProps) {
  return (
    <div className="text-center py-6">
      <div className="mb-6 flex justify-center">{icon}</div>
      <div className="text-5xl font-bold text-foreground mb-3">{number}</div>
      <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{label}</p>
    </div>
  );
}
