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

interface ServiciosYearlyComparisonResponse {
  status: string;
  data: {
    sistema: string;
    comparison: {
      [reserveType: string]: {
        currentYearData: Array<{
          Fecha: string;
          AvgPrecioReserva: number;
        }>;
        previousYearData: Array<{
          Fecha: string;
          AvgPrecioReserva: number;
        }>;
      };
    };
  };
}

const systemOptions = [
  { value: "BCA", label: "BCA" },
  { value: "BCS", label: "BCS" },
  { value: "SIN", label: "SIN" },
];

const timeRangeOptions = [
  { value: "full", label: "Todo el año" },
  { value: "3m", label: "Últimos 3 meses" },
  { value: "6m", label: "Últimos 6 meses" },
  { value: "9m", label: "Últimos 9 meses" },
];

export function ServiciosYearlyChart() {
  const [selectedSystem, setSelectedSystem] = React.useState("SIN");
  const [timeRange, setTimeRange] = React.useState("full");
  const [market, setMarket] = React.useState("mda");
  const [selectedReserveType, setSelectedReserveType] = React.useState("");

  const { data, isLoading, error } = useQuery<ServiciosYearlyComparisonResponse, Error>({
    queryKey: ["servicios-yearly-comparison", market, selectedSystem, timeRange],
    queryFn: async () => {
      const url = `${import.meta.env.VITE_API_URL}/api/v1/servicios-conexos/yearly-comparison-by-system?market=${market}&sistema=${selectedSystem}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch servicios yearly comparison data");
      return res.json();
    },
  });

  // Auto-select first reserve type when data loads
  React.useEffect(() => {
    if (data?.data?.comparison && !selectedReserveType) {
      const reserveTypes = Object.keys(data.data.comparison);
      if (reserveTypes.length > 0) {
        setSelectedReserveType(reserveTypes[0]);
      }
    }
  }, [data, selectedReserveType]);

  const processYearData = React.useCallback((yearData: Array<{Fecha: string, AvgPrecioReserva: number}>) => {
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
        y: item.AvgPrecioReserva,
      };
    });
  }, []);

  const { currentYearData, previousYearData, currentYear, previousYear, availableReserveTypes } = React.useMemo(() => {
    if (!data?.data?.comparison) return { 
      currentYearData: [], 
      previousYearData: [],
      currentYear: new Date().getFullYear(),
      previousYear: new Date().getFullYear() - 1,
      availableReserveTypes: []
    };
    
    const reserveTypes = Object.keys(data.data.comparison);
    
    const selectedData = data.data.comparison[selectedReserveType];
    if (!selectedData) {
      return {
        currentYearData: [], 
        previousYearData: [],
        currentYear: new Date().getFullYear(),
        previousYear: new Date().getFullYear() - 1,
        availableReserveTypes: reserveTypes
      };
    }
    
    // Filter data based on time range
    const filterByTimeRange = (yearData: Array<{Fecha: string, AvgPrecioReserva: number}>, isCurrentYear: boolean = true) => {
      if (timeRange === "full") return yearData;
      
      const months = timeRange === "3m" ? 3 : timeRange === "6m" ? 6 : 9;
      const currentDate = new Date();
      
      if (isCurrentYear) {
        const cutoffDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - months + 1, 1);
        return yearData.filter(item => {
          const itemDate = new Date(item.Fecha);
          return itemDate >= cutoffDate;
        });
      } else {
        const prevYear = currentDate.getFullYear() - 1;
        const cutoffDate = new Date(prevYear, currentDate.getMonth() - months + 1, 1);
        const endDate = new Date(prevYear, currentDate.getMonth() + 1, 0);
        
        return yearData.filter(item => {
          const itemDate = new Date(item.Fecha);
          return itemDate >= cutoffDate && itemDate <= endDate;
        });
      }
    };
    
    const filteredCurrentYear = filterByTimeRange(selectedData.currentYearData, true);
    const filteredPreviousYear = filterByTimeRange(selectedData.previousYearData, false);
    
    const processedCurrentYear = processYearData(filteredCurrentYear);
    const processedPreviousYear = processYearData(filteredPreviousYear);
    
    const currentYear = selectedData.currentYearData[0]?.Fecha ? 
      parseInt(selectedData.currentYearData[0].Fecha.slice(0, 4)) : new Date().getFullYear();
    const previousYear = selectedData.previousYearData[0]?.Fecha ? 
      parseInt(selectedData.previousYearData[0].Fecha.slice(0, 4)) : new Date().getFullYear() - 1;
    
    return {
      currentYearData: processedCurrentYear,
      previousYearData: processedPreviousYear,
      currentYear,
      previousYear,
      availableReserveTypes: reserveTypes
    };
  }, [data, processYearData, timeRange, selectedReserveType]);

  const handleDownloadCSV = React.useCallback(() => {
    if (!currentYearData.length && !previousYearData.length) return;

    // Create CSV header
    const headers = ['Fecha', `${currentYear}`, `${previousYear}`];
    
    // Create CSV rows - match data points by index
    const maxLength = Math.max(currentYearData.length, previousYearData.length);
    const rows = [];
    
    for (let i = 0; i < maxLength; i++) {
      const currentItem = currentYearData[i];
      const previousItem = previousYearData[i];
      const label = currentItem?.x || previousItem?.x || `Punto ${i + 1}`;
      const currentValue = currentItem?.y || '';
      const previousValue = previousItem?.y || '';
      
      rows.push([label, currentValue, previousValue]);
    }

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `servicios_yearly_${selectedReserveType.replace(/\s+/g, '_')}_${market}_${selectedSystem}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [currentYearData, previousYearData, currentYear, previousYear, selectedReserveType, market, selectedSystem]);

  const chartOptions: ApexOptions = {
    chart: {
      type: "area",
      height: 350, // Increased height to accommodate rotated labels
      toolbar: { show: false },
      fontFamily: "Inter, sans-serif",
    },
    colors: ["#2db2ac", "#a74044"],
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
          fontSize: "11px", // Slightly smaller font
        },
        rotate: -45, // Rotate labels to prevent overlap
        maxHeight: 60, // Limit label height
        trim: true, // Trim long labels
        show: true,
        // Show fewer labels for better UX when period is longer than 1 month
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
        const currentYearValue = series[0][dataPointIndex];
        const previousYearValue = series[1][dataPointIndex];
        const currentYear = w.config.series[0].name;
        const previousYear = w.config.series[1].name;
        
        return `
          <div style="
            background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
            color: white;
            padding: 10px 12px;
            border-radius: 6px;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
            font-family: Inter, sans-serif;
            min-width: 180px;
          ">
            <div style="font-weight: 600; margin-bottom: 6px; font-size: 12px;">${label}</div>
            <div style="display: flex; align-items: center; margin-bottom: 3px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #2db2ac; margin-right: 6px;"></div>
              <span style="font-size: 11px; color: rgba(255, 255, 255, 0.8);">${currentYear}:</span>
              <span style="font-weight: 600; margin-left: 4px; font-size: 12px;">$${currentYearValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
            <div style="display: flex; align-items: center;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #a74044; margin-right: 6px;"></div>
              <span style="font-size: 11px; color: rgba(255, 255, 255, 0.8);">${previousYear}:</span>
              <span style="font-weight: 600; margin-left: 4px; font-size: 12px;">$${previousYearValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
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
        <CardTitle>Promedio Diario: {currentYear} vs {previousYear} ({market.toUpperCase()})</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Comparación anual de {selectedReserveType || 'servicios conexos'} por sistema - {data?.data?.sistema || selectedSystem}
          </span>
          <span className="@[540px]/card:hidden">Servicios Anual - {data?.data?.sistema || selectedSystem}</span>
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
              defaultValue={selectedSystem}
              onChange={setSelectedSystem}
              className="w-32"
              placeholder="Sistema"
              options={systemOptions}
            />
            <Select
              key={selectedReserveType}
              defaultValue={selectedReserveType}
              onChange={setSelectedReserveType}
              className="w-60"
              placeholder="Tipo de Reserva"
              options={availableReserveTypes.map(type => ({
                value: type,
                label: type
              }))}
            />
            <Select
              defaultValue={timeRange}
              onChange={setTimeRange}
              className="w-fit max-w-70"
              placeholder="Período"
              options={timeRangeOptions}
            />
            <ChartActionsMenu 
              onDownloadCSV={handleDownloadCSV}
              disabled={isLoading || (!currentYearData.length && !previousYearData.length)}
            />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[350px] space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2db2ac]"></div>
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
              <div className="w-3 h-3 rounded-full bg-[#2db2ac]"></div>
              <span className="text-muted-foreground">
                Promedio {currentYear}: ${(currentYearData.reduce((sum, item) => sum + item.y, 0) / currentYearData.length || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#a74044]"></div>
              <span className="text-muted-foreground">
                Promedio {previousYear}: ${(previousYearData.reduce((sum, item) => sum + item.y, 0) / previousYearData.length || 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}