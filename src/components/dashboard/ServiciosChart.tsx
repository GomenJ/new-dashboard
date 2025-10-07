import * as React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Select from "@/components/form/Select";
import { ChartActionsMenu } from "@/components/common/ChartActionsMenu";

interface ServiciosResponse {
  status: string;
  data: Array<{
    date: string;
    averages: {
      "Reserva de regulacion secundaria"?: number;
      "Reserva no rodante de 10 minutos"?: number;
      "Reserva no rodante suplementarias"?: number;
      "Reserva rodante de 10 minutos"?: number;
      "Reserva rodante suplementaria"?: number;
    };
  }>;
}

export function ServiciosChart() {
  const [timeRange, setTimeRange] = React.useState("full");
  const [market, setMarket] = React.useState("mda");
  const [sistema, setSistema] = React.useState("SIN");

  const { data, isLoading, error } = useQuery<ServiciosResponse, Error>({
    queryKey: ["servicios-daily-averages", market, sistema],
    queryFn: async () => {
      const url = `${import.meta.env.VITE_API_URL}/api/v1/servicios-conexos/daily-averages?market=${market}&sistema=${sistema}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch servicios daily averages data");
      return res.json();
    },
  });

  const reserveTypes = [
    "Reserva de regulacion secundaria",
    "Reserva rodante de 10 minutos",
    "Reserva no rodante de 10 minutos", 
    "Reserva no rodante suplementarias",
    "Reserva rodante suplementaria"
  ];

  const colors = ["#0d9488", "#dc2626", "#d97706", "#7c3aed", "#059669"];

  const chartData = React.useMemo(() => {
    if (!data?.data) return { categories: [], series: [] };
    
    const categories = data.data.map((item) => {
      const dayString = item.date.slice(-2);
      const day = parseInt(dayString, 10);
      return `Día ${day}`;
    });

    const series = reserveTypes
      .map((reserveType) => {
        const seriesData = data.data.map(item => {
          const value = item.averages[reserveType as keyof typeof item.averages];
          return value !== undefined ? value : 0;
        });
        
        // Only include series that have at least one non-zero value
        if (seriesData.some(value => value > 0)) {
          return {
            name: reserveType,
            data: seriesData
          };
        }
        return null;
      })
      .filter(Boolean) as Array<{ name: string; data: number[] }>;
    
    return { categories, series };
  }, [data]);

  const filteredData = React.useMemo(() => {
    if (timeRange === "full") return chartData;
    
    const days = parseInt(timeRange.replace("d", ""));
    return {
      categories: chartData.categories.slice(-days),
      series: chartData.series.map(serie => ({
        ...serie,
        data: serie.data.slice(-days)
      }))
    };
  }, [chartData, timeRange]);

  const chartOptions: ApexOptions = {
    chart: {
      type: "line",
      height: 250,
      toolbar: { show: false },
      fontFamily: "Inter, sans-serif",
    },
    colors: colors,
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    grid: {
      show: true,
      strokeDashArray: 3,
      borderColor: "hsl(var(--border))",
    },
    xaxis: {
      categories: filteredData.categories,
      labels: {
        style: {
          colors: "hsl(var(--muted-foreground))",
          fontSize: "12px",
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      min: 0,
      labels: {
        style: {
          colors: "hsl(var(--muted-foreground))",
          fontSize: "12px",
        },
        formatter: (value: number) => `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      },
    },
    tooltip: {
      theme: "light",
      style: {
        fontSize: "12px",
        fontFamily: "Inter, sans-serif",
      },
      shared: true,
      intersect: false,
      y: {
        formatter: (value: number, { seriesName }: any) => {
          return `${seriesName}: $${value?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || 'N/A'}`;
        }
      }
    },
    legend: {
      show: true,
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "12px",
      fontFamily: "Inter, sans-serif",
      markers: {
        size: 6
      }
    },
  };

  const handleDownloadCSV = React.useCallback(() => {
    if (!data?.data || !filteredData.series.length) return;

    // Create CSV header
    const headers = ['Fecha', ...filteredData.series.map(s => s.name)];
    
    // Create CSV rows
    const rows = filteredData.categories.map((_, index) => {
      const date = data.data[index]?.date || '';
      const values = filteredData.series.map(series => series.data[index] || 0);
      return [date, ...values];
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `servicios_conexos_${market}_${sistema}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [data, filteredData, market, sistema]);

  const series = filteredData.series;

  if (error) {
    return (
      <Card className="@container/card">
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-red-600">Error cargando datos del gráfico: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Promedio Diario del Mes - {market.toUpperCase()}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Promedio diario de los precios de servicios conexos del mes actual
          </span>
          <span className="@[540px]/card:hidden">Servicios Conexos - Mes Actual</span>
        </CardDescription>
        <CardAction>
          <div className="flex gap-2">
            <Select
              defaultValue={market}
              onChange={setMarket}
              className="w-24"
              placeholder="Mercado"
              options={[
                { value: "mda", label: "MDA" },
                { value: "mtr", label: "MTR" },
              ]}
            />
            <Select
              defaultValue={sistema}
              onChange={setSistema}
              className="w-24"
              placeholder="Sistema"
              options={[
                { value: "BCA", label: "BCA" },
                { value: "BCS", label: "BCS" },
                { value: "SIN", label: "SIN" },
              ]}
            />
            <Select
              defaultValue={timeRange}
              onChange={setTimeRange}
              className="w-40"
              placeholder="Mes completo"
              options={[
                { value: "full", label: "Mes completo" },
                { value: "7d", label: "Últimos 7 días" },
                { value: "15d", label: "Últimos 15 días" },
              ]}
            />
            <ChartActionsMenu 
              onDownloadCSV={handleDownloadCSV}
              disabled={isLoading || !data?.data?.length}
            />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[250px] space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2db2ac]"></div>
            <p className="text-sm text-muted-foreground animate-pulse">Cargando datos del gráfico...</p>
          </div>
        ) : (
          <Chart
            options={chartOptions}
            series={series}
            type="line"
            height={250}
          />
        )}
        {data && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredData.series.length} tipos de reserva
            </span>
            <span className="text-muted-foreground">
              {filteredData.categories.length} días de datos
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}