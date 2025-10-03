import { ServiciosChart } from "./ServiciosChart";
import { ServiciosYearlyChart } from "./ServiciosYearlyChart";
import { ServiciosConexosSectionCards } from "./ServiciosConexosSectionCards";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ServiciosConexosSection() {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Precios de Servicios Conexos</CardTitle>
        <CardDescription>
          Promedio Diario y comparativo anual de los precios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section Cards */}
        <ServiciosConexosSectionCards />
        
        {/* Daily Chart */}
        <ServiciosChart />
        
        {/* Yearly Comparison Chart */}
        <ServiciosYearlyChart />
      </CardContent>
    </Card>
  );
}