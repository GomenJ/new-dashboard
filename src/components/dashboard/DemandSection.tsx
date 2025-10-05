import { DemandSectionCards } from "./DemandSectionCards";
import { DemandYearlyChart } from "./DemandYearlyChart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DemandSection() {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Comparativa de Demanda Máxima Diaria</CardTitle>
        <CardDescription>
          Análisis comparativo de la demanda máxima registrada por año
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section Cards */}
        <DemandSectionCards />
        
        {/* Yearly Comparison Chart */}
        <DemandYearlyChart />
      </CardContent>
    </Card>
  );
}