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

interface PmlYearlyComparisonResponse {
  status: string;
  data: {
    sistema?: string;
    market?: string;
    currentYearData?: Array<{
      Fecha: string;
      AvgPML: number;
    }>;
    previousYearData?: Array<{
      Fecha: string;
      AvgPML: number;
    }>;
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

export function PmlYearlyChart() {
  const [selectedSystem, setSelectedSystem] = React.useState("SIN");
  const [timeRange, setTimeRange] = React.useState("full");
  const [market, setMarket] = React.useState("mda");

  // Build API URL
  const buildApiUrl = React.useCallback(() => {
    return `${import.meta.env.VITE_API_URL}/api/v1/pml/yearly-comparison-by-system?market=${market}&sistema=${selectedSystem}`;
  }, [market, selectedSystem]);

  const { data, isLoading, error } = useQuery<PmlYearlyComparisonResponse, Error>({
    queryKey: ["pml-yearly-comparison", market, selectedSystem, timeRange],
    queryFn: async () => {
      const url = buildApiUrl();
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch PML yearly comparison data");
      return res.json();
    },
  });

  const processYearData = React.useCallback((yearData: Array<{Fecha: string, AvgPML: number}>) => {
    if (!yearData || yearData.length === 0) return [];
    
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
                       "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    
    return yearData.map((item) => {
      // Extract month and day from date string "2025-01-01" -> "01-01"
      const monthDay = item.Fecha.slice(5); // Get everything after "YYYY-"
      const [month, day] = monthDay.split('-');
      const monthNumber = parseInt(month, 10);
      const dayNumber = parseInt(day, 10);
      
      // Format as "Ene 1", "Feb 15", etc.
      return {
        x: `${monthNames[monthNumber - 1]} ${dayNumber}`,
        y: item.AvgPML,
      };
    });
  }, []);

  const { chartData, currentYear, previousYear } = React.useMemo(() => {
    console.log('Processing chartData...', { hasData: !!data?.data, timeRange });
    
    if (!data?.data) return { 
      chartData: {},
      currentYear: new Date().getFullYear(),
      previousYear: new Date().getFullYear() - 1
    };

    // Handle flat structure response
    if (data.data.currentYearData && data.data.previousYearData) {
      const rawCurrentYearData = data.data.currentYearData;
      const rawPreviousYearData = data.data.previousYearData;
      
      console.log('Data sizes:', { 
        current: rawCurrentYearData.length, 
        previous: rawPreviousYearData.length 
      });
      
      return {
        chartData: {
          "Sistema": {
            currentYearData: rawCurrentYearData,
            previousYearData: rawPreviousYearData
          }
        },
        currentYear: rawCurrentYearData[0]?.Fecha ? parseInt(rawCurrentYearData[0].Fecha.slice(0, 4)) : new Date().getFullYear(),
        previousYear: rawPreviousYearData[0]?.Fecha ? parseInt(rawPreviousYearData[0].Fecha.slice(0, 4)) : new Date().getFullYear() - 1
      };
    }

    return {
      chartData: {},
      currentYear: new Date().getFullYear(),
      previousYear: new Date().getFullYear() - 1
    };
  }, [data, timeRange]);

  // Filter data based on time range and process for chart
  const { processedData, categories } = React.useMemo(() => {
    console.log('Processing filtered data...', { chartDataKeys: Object.keys(chartData), timeRange });
    
    // Early return if no chart data
    if (!chartData || Object.keys(chartData).length === 0) {
      console.log('No chartData, returning empty');
      return { processedData: {}, categories: [] };
    }

    const filterByTimeRange = (yearData: Array<{Fecha: string, AvgPML: number}>, isCurrentYear: boolean = true) => {
      if (!yearData || yearData.length === 0) return [];
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

    const processedData: Record<string, { currentYear: Array<{x: string, y: number}>, previousYear: Array<{x: string, y: number}> }> = {};
    let allFilteredDates = new Set<string>();

    Object.entries(chartData).forEach(([sistema, nodeData]) => {
      const filteredCurrentYear = filterByTimeRange(nodeData.currentYearData, true);
      const filteredPreviousYear = filterByTimeRange(nodeData.previousYearData, false);
      
      // Extract dates as month-day only (without year) to align both years
      filteredCurrentYear.forEach(d => {
        const monthDay = d.Fecha.slice(5); // Get "MM-DD" part
        allFilteredDates.add(monthDay);
      });
      filteredPreviousYear.forEach(d => {
        const monthDay = d.Fecha.slice(5); // Get "MM-DD" part  
        allFilteredDates.add(monthDay);
      });
      
      processedData[sistema] = {
        currentYear: processYearData(filteredCurrentYear),
        previousYear: processYearData(filteredPreviousYear)
      };
    });

    // Generate categories from unique month-day combinations
    const sortedDates = Array.from(allFilteredDates).sort();
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const categories = sortedDates.map(monthDay => {
      const [month, day] = monthDay.split('-');
      const monthNumber = parseInt(month, 10);
      const dayNumber = parseInt(day, 10);
      return `${monthNames[monthNumber - 1]} ${dayNumber}`;
    });

    console.log('Categories count:', categories.length, 'Unique dates:', sortedDates.length);

    return { processedData, categories };
  }, [chartData, timeRange, processYearData]);

  // Generate chart series with colors
  const series = React.useMemo(() => {
    // Early return if no processed data
    if (!processedData || Object.keys(processedData).length === 0 || !categories.length) {
      return [];
    }

    const colors = ['#2db2ac', '#a74044', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#06b6d4', '#f97316', '#84cc16', '#ec4899'];
    const seriesData: any[] = [];
    let colorIndex = 0;

    Object.entries(processedData).forEach(([sistema, nodeData]) => {
      // Current year series
      const currentYearColor = colors[colorIndex % colors.length];
      const currentYearData = categories.map(category => {
        const dataPoint = nodeData.currentYear.find(d => d.x === category);
        return dataPoint ? dataPoint.y : null;
      });
      
      seriesData.push({
        name: `${sistema} ${currentYear}`,
        data: currentYearData,
        color: currentYearColor
      });
      
      // Previous year series (slightly darker/lighter variant)
      const previousYearColor = colors[(colorIndex + 5) % colors.length];
      const previousYearData = categories.map(category => {
        const dataPoint = nodeData.previousYear.find(d => d.x === category);
        return dataPoint ? dataPoint.y : null;
      });
      
      seriesData.push({
        name: `${sistema} ${previousYear}`,
        data: previousYearData,
        color: previousYearColor
      });
      
      colorIndex++;
    });

    return seriesData;
  }, [processedData, categories, currentYear, previousYear]);

  // CSV Download function
  const downloadCSV = React.useCallback(() => {
    if (!data?.data) return;

    const csvRows: string[] = [];
    const headers = ['Date', 'Sistema', 'Year', 'PML_USD'];
    csvRows.push(headers.join(','));

    // Process data for CSV
    Object.entries(processedData).forEach(([sistema, nodeData]) => {
      // Current year data
      nodeData.currentYear.forEach((dataPoint, index) => {
        if (dataPoint.y !== null) {
          const dateStr = categories[index] || dataPoint.x;
          csvRows.push(`"${dateStr}","${sistema}",${currentYear},${dataPoint.y}`);
        }
      });
      
      // Previous year data
      nodeData.previousYear.forEach((dataPoint, index) => {
        if (dataPoint.y !== null) {
          const dateStr = categories[index] || dataPoint.x;
          csvRows.push(`"${dateStr}","${sistema}",${previousYear},${dataPoint.y}`);
        }
      });
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const filename = `pml_yearly_comparison_${market}_${selectedSystem}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [data, processedData, categories, currentYear, previousYear, market, selectedSystem]);

  const chartOptions: ApexOptions = {
    chart: {
      type: "area",
      height: 350, // Increased height to accommodate rotated labels
      toolbar: { show: false },
      fontFamily: "Inter, sans-serif",
    },
    colors: series.map(s => s.color),
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
      categories: categories,
      labels: {
        style: {
          colors: "hsl(var(--muted-foreground))",
          fontSize: "11px", // Slightly smaller font
        },
        rotate: -45, // Rotate labels to prevent overlap
        maxHeight: 60, // Limit label height
        trim: true, // Trim long labels
        show: true,
        showDuplicates: false,
        // Dynamically show fewer labels based on data size and time range
        ...(categories.length > 30 && {
          formatter: function(value: string, _timestamp?: number, opts?: any) {
            if (!opts || !opts.dataPointIndex) return value;
            const index = opts.dataPointIndex;
            
            // For full year or large datasets, show only certain intervals
            if (timeRange === "full") {
              // Show only first day of each month or every 15th day
              const dayMatch = value.match(/(\w+)\s+(\d+)/);
              if (dayMatch) {
                const day = parseInt(dayMatch[2]);
                return (day === 1 || day === 15) ? value : "";
              }
            } else if (categories.length > 60) {
              // For very large datasets, show every 4th label
              return index % 4 === 0 ? value : "";
            } else if (categories.length > 30) {
              // For medium datasets, show every 2nd label
              return index % 2 === 0 ? value : "";
            }
            
            return value;
          }
        })
      },
      tickAmount: timeRange === "full" ? 24 : timeRange === "9m" ? 18 : timeRange === "6m" ? 12 : Math.min(categories.length, 15),
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
        formatter: (value: number) => `$${value?.toLocaleString("en-US", { maximumFractionDigits: 0 }) || '0'}`,
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
            min-width: 180px;
          ">
            <div style="font-weight: 600; margin-bottom: 6px; font-size: 12px;">${label}</div>
        `;
        
        let hasData = false;
        
        // Add each series data point
        series.forEach((seriesData: number[], index: number) => {
          if (seriesData[dataPointIndex] !== null && seriesData[dataPointIndex] !== undefined) {
            hasData = true;
            const seriesName = w.config.series[index].name;
            const seriesColor = w.config.colors[index];
            const value = seriesData[dataPointIndex];
            
            tooltipContent += `
              <div style="display: flex; align-items: center; margin-bottom: 3px;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${seriesColor}; margin-right: 6px;"></div>
                <span style="font-size: 11px; color: rgba(255, 255, 255, 0.8);">${seriesName}:</span>
                <span style="font-weight: 600; margin-left: 4px; font-size: 12px;">$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
            `;
          }
        });
        
        if (!hasData) {
          return '';
        }
        
        tooltipContent += '</div>';
        return tooltipContent;
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
        <CardTitle>PML Promedio Diario ({market.toUpperCase()}): {currentYear} vs {previousYear}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Comparación anual del Precio Marginal Local por sistema - {data?.data?.sistema || selectedSystem}
          </span>
          <span className="@[440px]/card:hidden">PML Anual - {data?.data?.sistema || selectedSystem}</span>
        </CardDescription>
        <CardAction>
          <div className="flex gap-2 items-center">
            {/* Chart Actions Menu */}
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
              defaultValue={selectedSystem}
              onChange={(value) => {
                setSelectedSystem(value);
              }}
              className="w-32"
              placeholder="Sistema"
              options={systemOptions}
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
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2db2ac]"></div>
            <p className="text-sm text-muted-foreground animate-pulse">Cargando comparación anual...</p>
          </div>
        ) : !data?.data || Object.keys(chartData).length === 0 ? (
          <div className="flex items-center justify-center h-[350px]">
            <p className="text-muted-foreground">No hay datos disponibles</p>
          </div>
        ) : (
          <Chart
            options={chartOptions}
            series={series}
            type="area"
            height={350}
          />
        )}
        {data && Object.keys(chartData).length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">Promedios del Sistema:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {Object.entries(processedData).map(([sistema, nodeData], index) => {
                const currentAvg = nodeData.currentYear.reduce((sum, item) => sum + (item.y || 0), 0) / (nodeData.currentYear.filter(item => item.y !== null).length || 1);
                const previousAvg = nodeData.previousYear.reduce((sum, item) => sum + (item.y || 0), 0) / (nodeData.previousYear.filter(item => item.y !== null).length || 1);
                const colors = ['#2db2ac', '#a74044', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#06b6d4', '#f97316', '#84cc16', '#ec4899'];
                const color = colors[index % colors.length];
                
                return (
                  <div key={sistema} className="space-y-1">
                    <div className="font-medium text-foreground">{sistema}</div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
                      <span className="text-muted-foreground">
                        {currentYear}: ${currentAvg.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[(index + 5) % colors.length] }}></div>
                      <span className="text-muted-foreground">
                        {previousYear}: ${previousAvg.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}