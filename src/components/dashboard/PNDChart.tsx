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

interface PNDResponse {
  status: string;
  data: {
    market: string;
    averages_by_day: Array<{
      date: string;
      zones: {
        CABORCA: number;
        TAMPICO: number;
        "RIVIERA MAYA": number;
        "MOTUL TIZIMIN": number;
        JUAREZ: number;
        QUERETARO: number;
        PUEBLA: number;
        "VDM NORTE": number;
      };
    }>;
  };
}

const ZONE_NAMES = [
  "CABORCA",
  "TAMPICO", 
  "RIVIERA MAYA",
  "MOTUL TIZIMIN",
  "JUAREZ",
  "QUERETARO", 
  "PUEBLA",
  "VDM NORTE"
] as const;

const ZONE_COLORS = [
  "#2db2ac", // Teal
  "#a74044", // Red
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#10b981", // Emerald
  "#ef4444", // Red
  "#06b6d4", // Cyan
  "#f97316", // Orange
];

export function PNDChart() {
  const [timeRange, setTimeRange] = React.useState("full");
  const [market, setMarket] = React.useState("mda");

  const { data, isLoading, error } = useQuery<PNDResponse, Error>({
    queryKey: ["pnd-daily-averages", market],
    queryFn: async () => {
      const url = `${import.meta.env.VITE_API_URL}/api/v1/pnd/current-month-daily-averages-by-zonas?market=${market}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch PND data");
      return res.json();
    },
  });

  const { chartData, categories } = React.useMemo(() => {
    if (!data?.data?.averages_by_day) return { chartData: {}, categories: [] };
    
    const chartData: Record<string, number[]> = {};
    const categories: string[] = [];
    
    // Initialize data arrays for each zone
    ZONE_NAMES.forEach(zone => {
      chartData[zone] = [];
    });
    
    // Process each day's data
    data.data.averages_by_day.forEach((dayData) => {
      // Extract day from date string "2025-10-01" -> "01" -> "1"
      const dayString = dayData.date.slice(-2); // Get last 2 characters
      const day = parseInt(dayString, 10); // Parse to number (removes leading zero)
      categories.push(`Día ${day}`);
      
      // Add each zone's value for this day
      ZONE_NAMES.forEach(zone => {
        chartData[zone].push(dayData.zones[zone]);
      });
    });
    
    return { chartData, categories };
  }, [data]);

  const filteredData = React.useMemo(() => {
    if (timeRange === "full") return { chartData, categories };
    
    const days = parseInt(timeRange.replace("d", ""));
    const filteredCategories = categories.slice(-days);
    const filteredChartData: Record<string, number[]> = {};
    
    ZONE_NAMES.forEach(zone => {
      filteredChartData[zone] = chartData[zone]?.slice(-days) || [];
    });
    
    return { chartData: filteredChartData, categories: filteredCategories };
  }, [chartData, categories, timeRange]);

  // CSV Download function
  const downloadCSV = React.useCallback(() => {
    if (!data?.data) return;

    const csvRows: string[] = [];
    const headers = ['Date', ...ZONE_NAMES];
    csvRows.push(headers.join(','));

    // Add data rows
    filteredData.categories.forEach((day, index) => {
      const row = [day];
      ZONE_NAMES.forEach(zone => {
        row.push(filteredData.chartData[zone]?.[index]?.toString() || '0');
      });
      csvRows.push(row.map(cell => `"${cell}"`).join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const filename = `pnd_daily_zones_${market}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [data, filteredData, market]);

  const chartOptions: ApexOptions = {
    chart: {
      type: "line",
      height: 350,
      toolbar: { show: false },
      fontFamily: "Inter, sans-serif",
    },
    colors: ZONE_COLORS,
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: 2,
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
      custom: function({series, dataPointIndex, w}) {
        const label = w.globals.labels[dataPointIndex];
        let tooltipContent = `
          <div style="
            background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
            color: white;
            padding: 10px 12px;
            border-radius: 6px;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
            font-family: Inter, sans-serif;
            min-width: 200px;
          ">
            <div style="font-weight: 600; margin-bottom: 6px; font-size: 12px;">${label}</div>
        `;
        
        // Add each zone's data point
        series.forEach((seriesData: number[], index: number) => {
          if (seriesData[dataPointIndex] !== null) {
            const zoneName = ZONE_NAMES[index];
            const zoneColor = ZONE_COLORS[index];
            const value = seriesData[dataPointIndex];
            
            tooltipContent += `
              <div style="display: flex; align-items: center; margin-bottom: 3px;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${zoneColor}; margin-right: 6px;"></div>
                <span style="font-size: 11px; color: rgba(255, 255, 255, 0.8);">${zoneName}:</span>
                <span style="font-weight: 600; margin-left: 4px; font-size: 12px;">$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
            `;
          }
        });
        
        tooltipContent += '</div>';
        return tooltipContent;
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "center",
      labels: {
        colors: "hsl(var(--muted-foreground))",
      },
      markers: {
        size: 8,
        shape: "circle",
      },
    },
  };

  const series = ZONE_NAMES.map((zone, index) => ({
    name: zone,
    data: filteredData.chartData[zone] || [],
    color: ZONE_COLORS[index],
  }));

  if (error) {
    return (
      <Card className="@container/card">
        <CardContent className="flex items-center justify-center h-[400px]">
          <p className="text-red-600">Error cargando datos del gráfico: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>PND por Zonas - {market.toUpperCase()}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Precios Nodo Distribuido promedio diario por zona del mes actual
          </span>
          <span className="@[540px]/card:hidden">PND por Zonas - Mes Actual</span>
        </CardDescription>
        <CardAction>
          <div className="flex gap-2 items-center">
            <ChartActionsMenu 
              onDownloadCSV={downloadCSV}
              disabled={!data?.data}
            />
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
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[350px] space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2db2ac]"></div>
            <p className="text-sm text-muted-foreground animate-pulse">Cargando datos del gráfico...</p>
          </div>
        ) : (
          <Chart
            options={chartOptions}
            series={series}
            type="line"
            height={350}
          />
        )}
        {data && data.data.averages_by_day.length > 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredData.categories.length} días de datos PND por zona
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}