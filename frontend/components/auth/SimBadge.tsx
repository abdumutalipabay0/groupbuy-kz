import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function SimBadge() {
  return (
    <Badge tone="green" className="gap-1">
      <ShieldCheck size={14} />
      SIM доверие
    </Badge>
  );
}
