import { useState } from "react";
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
  const [sistema, setSistema] = useState<string>("SIN");
  const [tipoReserva, setTipoReserva] = useState<string>("Reserva de regulacion secundaria");

  const sistemaOptions = [
    { value: "SIN", label: "SIN" },
    { value: "BCA", label: "BCA" },
    { value: "BCS", label: "BCS" },
  ];

  const tipoReservaOptions = [
    { value: "Reserva de regulacion secundaria", label: "Reserva de regulación secundaria" },
    { value: "Reserva no rodante de 10 minutos", label: "Reserva no rodante de 10 minutos" },
    { value: "Reserva no rodante suplementarias", label: "Reserva no rodante suplementarias" },
    { value: "Reserva rodante de 10 minutos", label: "Reserva rodante de 10 minutos" },
    { value: "Reserva rodante suplementaria", label: "Reserva rodante suplementaria" },
  ];

  return (
    <Card className="@container/card">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Precios de Servicios Conexos</CardTitle>
            <CardDescription>
              Promedio Diario y comparativo anual de los precios
            </CardDescription>
          </div>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-1">
              <label htmlFor="sistema-select" className="text-sm font-medium text-muted-foreground">
                Sistema
              </label>
              <select
                id="sistema-select"
                value={sistema}
                onChange={(e) => setSistema(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sistemaOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col gap-1">
              <label htmlFor="tipo-reserva-select" className="text-sm font-medium text-muted-foreground">
                Tipo de Reserva
              </label>
              <select
                id="tipo-reserva-select"
                value={tipoReserva}
                onChange={(e) => setTipoReserva(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-w-[250px]"
              >
                {tipoReservaOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section Cards */}
        <ServiciosConexosSectionCards sistema={sistema} tipoReserva={tipoReserva} />
        
        {/* Daily Chart */}
        <ServiciosChart />
        
        {/* Yearly Comparison Chart */}
        <ServiciosYearlyChart />
      </CardContent>
    </Card>
  );
}