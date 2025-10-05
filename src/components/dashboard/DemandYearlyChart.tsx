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

interface DemandYearlyComparisonResponse {
  currentYearData: Array<{
    Fecha: string;
    MaxDemanda_MWh: number;
    Hora: number;
  }>;
  previousYearData: Array<{
    Fecha: string;
    MaxDemanda_MWh: number;
    Hora: number;
  }>;
}

const gerenciaOptions = [
  { value: "all", label: "Todas" },
  { value: "Baja California", label: "Baja California" },
  { value: "Baja California Sur", label: "Baja California Sur" },
  { value: "Occidental", label: "Occidental" },
  { value: "Oriental", label: "Oriental" },
  { value: "Noreste", label: "Noreste" },
  { value: "Norte", label: "Norte" },
  { value: "Noroeste", label: "Noroeste" },
  { value: "Central", label: "Central" },
  { value: "Peninsular", label: "Peninsular" },
];

const timeRangeOptions = [
  { value: "full", label: "Todo el año" },
  { value: "3m", label: "Últimos 3 meses" },
  { value: "6m", label: "Últimos 6 meses" },
  { value: "9m", label: "Últimos 9 meses" },
];

export function DemandYearlyChart() {
  const [selectedGerencia, setSelectedGerencia] = React.useState("all");
  const [timeRange, setTimeRange] = React.useState("full");

  const { data, isLoading, error } = useQuery<DemandYearlyComparisonResponse, Error>({
    queryKey: ["demand-yearly-comparison", selectedGerencia, timeRange],
    queryFn: async () => {
      const url = `${import.meta.env.VITE_API_URL}/api/v1/demanda/daily-peak-comparison?gerencia=${selectedGerencia}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch demand yearly comparison data");
      return res.json();
    },
  });

  const processYearData = React.useCallback((yearData: Array<{Fecha: string, MaxDemanda_MWh: number, Hora: number}>) => {
    if (!yearData || yearData.length === 0) return [];
    
    return yearData.map((item) => {
      // Extract month and day from date string "2025-01-01" -> "01-01"
      const monthDay = item.Fecha.slice(5); // Get everything after "YYYY-"
      const [month, day] = monthDay.split('-');
      const monthNumber = parseInt(month, 10);
      const dayNumber = parseInt(day, 10);
      
      // Format as "Ene 1", "Feb 15", etc.
      const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
                         "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      
      return {
        x: `${monthNames[monthNumber - 1]} ${dayNumber}`,
        y: item.MaxDemanda_MWh,
        hora: item.Hora, // Store hour for tooltip
      };
    });
  }, []);

  const { currentYearData, previousYearData, currentYear, previousYear } = React.useMemo(() => {
    if (!data || !data.currentYearData || !data.previousYearData) return { 
      currentYearData: [], 
      previousYearData: [],
      currentYear: new Date().getFullYear(),
      previousYear: new Date().getFullYear() - 1
    };
    
    // Filter data based on time range
    const filterByTimeRange = (yearData: Array<{Fecha: string, MaxDemanda_MWh: number, Hora: number}>, isCurrentYear: boolean = true) => {
      if (!yearData || yearData.length === 0) return [];
      if (timeRange === "full") return yearData; // Return all data for "Todo el año"
      
      const months = timeRange === "3m" ? 3 : timeRange === "6m" ? 6 : 9;
      const currentDate = new Date();
      
      if (isCurrentYear) {
        // For current year: filter based on current date
        const cutoffDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - months + 1, 1);
        return yearData.filter(item => {
          const itemDate = new Date(item.Fecha);
          return itemDate >= cutoffDate;
        });
      } else {
        // For previous year: filter the same period from previous year
        const prevYear = currentDate.getFullYear() - 1;
        const cutoffDate = new Date(prevYear, currentDate.getMonth() - months + 1, 1);
        const endDate = new Date(prevYear, currentDate.getMonth() + 1, 0); // Last day of current month in prev year
        
        return yearData.filter(item => {
          const itemDate = new Date(item.Fecha);
          return itemDate >= cutoffDate && itemDate <= endDate;
        });
      }
    };
    
    const filteredCurrentYear = filterByTimeRange(data.currentYearData, true);
    const filteredPreviousYear = filterByTimeRange(data.previousYearData, false);
    
    const processedCurrentYear = processYearData(filteredCurrentYear);
    const processedPreviousYear = processYearData(filteredPreviousYear);
    
    // Extract years from the first date in each dataset
    const currentYear = data.currentYearData[0]?.Fecha ? 
      parseInt(data.currentYearData[0].Fecha.slice(0, 4)) : new Date().getFullYear();
    const previousYear = data.previousYearData[0]?.Fecha ? 
      parseInt(data.previousYearData[0].Fecha.slice(0, 4)) : new Date().getFullYear() - 1;
    
    return {
      currentYearData: processedCurrentYear,
      previousYearData: processedPreviousYear,
      currentYear,
      previousYear
    };
  }, [data, processYearData, timeRange]);

  const chartOptions: ApexOptions = {
    chart: {
      type: "area",
      height: 350,
      toolbar: { show: false },
      fontFamily: "Inter, sans-serif",
    },
    colors: ["#3b82f6", "#ef4444"],
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.6,
        opacityTo: 0.1,
        stops: [0, 100],
      },
    },
    grid: {
      show: true,
      strokeDashArray: 3,
      borderColor: "hsl(var(--border))",
    },
    xaxis: {
      categories: currentYearData.map(item => item.x),
      labels: {
        style: {
          colors: "hsl(var(--muted-foreground))",
          fontSize: "11px",
        },
        rotate: -45,
        maxHeight: 60,
        trim: true,
        show: true,
        showDuplicates: false,
      },
      tickAmount: timeRange === "full" ? 12 : timeRange === "9m" ? 9 : timeRange === "6m" ? 6 : undefined,
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
        formatter: (value: number) => `${value.toLocaleString("en-US", { maximumFractionDigits: 0 })} MW`,
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
        const currentYearValue = series[0][dataPointIndex];
        const previousYearValue = series[1][dataPointIndex];
        const currentYear = w.config.series[0].name;
        const previousYear = w.config.series[1].name;
        
        // Get hour information from processed data
        const currentYearHour = currentYearData[dataPointIndex]?.hora || '--';
        const previousYearHour = previousYearData[dataPointIndex]?.hora || '--';
        
        return `
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
            <div style="display: flex; align-items: center; margin-bottom: 3px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #3b82f6; margin-right: 6px;"></div>
              <span style="font-size: 11px; color: rgba(255, 255, 255, 0.8);">${currentYear}:</span>
              <span style="font-weight: 600; margin-left: 4px; font-size: 12px;">${currentYearValue.toLocaleString("en-US", { maximumFractionDigits: 0 })} MW</span>
              <span style="margin-left: 8px; font-size: 10px; color: rgba(255, 255, 255, 0.6);">@${currentYearHour}:00h</span>
            </div>
            <div style="display: flex; align-items: center;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #ef4444; margin-right: 6px;"></div>
              <span style="font-size: 11px; color: rgba(255, 255, 255, 0.8);">${previousYear}:</span>
              <span style="font-weight: 600; margin-left: 4px; font-size: 12px;">${previousYearValue.toLocaleString("en-US", { maximumFractionDigits: 0 })} MW</span>
              <span style="margin-left: 8px; font-size: 10px; color: rgba(255, 255, 255, 0.6);">@${previousYearHour}:00h</span>
            </div>
          </div>
        `;
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
      labels: {
        colors: "hsl(var(--muted-foreground))",
      },
    },
  };

  const series = [
    {
      name: `${currentYear}`,
      data: currentYearData.map(item => item.y),
    },
    {
      name: `${previousYear}`,
      data: previousYearData.map(item => item.y),
    },
  ];

  if (error) {
    return (
      <Card className="@container/card">
        <CardContent className="flex items-center justify-center h-[350px]">
          <p className="text-red-600">Error cargando datos del gráfico: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Demanda Máxima Diaria: {currentYear} vs {previousYear}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Comparación anual de la demanda máxima diaria por gerencia - {selectedGerencia === 'all' ? 'Todas' : selectedGerencia}
          </span>
          <span className="@[540px]/card:hidden">Demanda Anual - {selectedGerencia === 'all' ? 'Todas' : selectedGerencia}</span>
        </CardDescription>
        <CardAction>
          <div className="flex gap-2">
            <Select
              defaultValue={selectedGerencia}
              onChange={setSelectedGerencia}
              className="w-40"
              placeholder="Gerencia"
              options={gerenciaOptions}
            />
            <Select
              defaultValue={timeRange}
              onChange={setTimeRange}
              className="w-fit max-w-70"
              placeholder="Período"
              options={timeRangeOptions}
            />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[350px] space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3b82f6]"></div>
            <p className="text-sm text-muted-foreground animate-pulse">Cargando comparación anual...</p>
          </div>
        ) : (
          <Chart
            options={chartOptions}
            series={series}
            type="area"
            height={350}
          />
        )}
        {data && (
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
              <span className="text-muted-foreground">
                Promedio {currentYear}: {(currentYearData.reduce((sum, item) => sum + item.y, 0) / currentYearData.length || 0).toFixed(0)} MW
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
              <span className="text-muted-foreground">
                Promedio {previousYear}: {(previousYearData.reduce((sum, item) => sum + item.y, 0) / previousYearData.length || 0).toFixed(0)} MW
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}