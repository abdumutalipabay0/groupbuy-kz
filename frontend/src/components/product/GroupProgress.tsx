import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Group, Product } from "@/types";

interface GroupProgressProps {
  group: Group | null;
  product: Product;
}

export function GroupProgress({ group, product }: GroupProgressProps) {
  const threshold = group?.threshold ?? product.group_threshold;
  const members = group?.current_members ?? Math.ceil(threshold * 0.55);
  const progress = (members / threshold) * 100;
  const spotsLeft = Math.max(threshold - members, 0);

  return (
    <div className="space-y-2">
      <ProgressBar value={progress} />
      <div className="flex items-center justify-between text-[11px] font-bold text-inkSoft">
        <span>
          {members}/{threshold} в команде
        </span>
        <span>{spotsLeft === 0 ? "цена открыта" : `ещё ${spotsLeft}`}</span>
      </div>
    </div>
  );
}
