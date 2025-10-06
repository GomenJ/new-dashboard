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
import { Check, ChevronDown } from "lucide-react";
import { ChartActionsMenu } from "@/components/common/ChartActionsMenu";

interface PmlYearlyComparisonResponse {
  status: string;
  data: {
    sistema?: string;
    market?: string;
    // For "All" selection (flat structure)
    currentYearData?: Array<{
      Fecha: string;
      AvgPML: number;
    }>;
    previousYearData?: Array<{
      Fecha: string;
      AvgPML: number;
    }>;
    // For specific ClaveNodo selection (nested structure)
    nodes?: {
      [claveNodo: string]: {
        currentYearData: Array<{
          Fecha: string;
          AvgPML: number;
        }>;
        previousYearData: Array<{
          Fecha: string;
          AvgPML: number;
        }>;
      };
    };
  };
}

interface ClaveNodoResponse {
  status: string;
  data: {
    market: string;
    sistema: string;
    count: number;
    claveNodos: string[];
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
  const [selectedClaveNodos, setSelectedClaveNodos] = React.useState<string[]>(["all"]);
  const [isClaveNodoOpen, setIsClaveNodoOpen] = React.useState(false);

  // Fetch ClaveNodo options
  const { data: claveNodoData } = useQuery<ClaveNodoResponse, Error>({
    queryKey: ["pml-clave-nodo", market, selectedSystem],
    queryFn: async () => {
      const url = `${import.meta.env.VITE_API_URL}/api/v1/pml/clave-nodo?market=${market}&sistema=${selectedSystem}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch ClaveNodo options");
      return res.json();
    },
  });

  // Build ClaveNodo options
  const claveNodoOptions = React.useMemo(() => {
    const baseOptions = [{ value: "all", label: "All" }];
    if (claveNodoData?.data?.claveNodos) {
      const nodeOptions = claveNodoData.data.claveNodos.map(claveNodo => ({
        value: claveNodo,
        label: claveNodo
      }));
      return [...baseOptions, ...nodeOptions];
    }
    return baseOptions;
  }, [claveNodoData]);

  // Build API URL based on ClaveNodo selection
  const buildApiUrl = React.useCallback(() => {
    const baseUrl = `${import.meta.env.VITE_API_URL}/api/v1/pml/yearly-comparison-by-system?market=${market}&sistema=${selectedSystem}`;
    
    if (selectedClaveNodos.includes("all") || selectedClaveNodos.length === 0) {
      return baseUrl;
    }
    
    const claveNodoParams = selectedClaveNodos.map(node => `claveNodo=${node}`).join('&');
    return `${baseUrl}&${claveNodoParams}`;
  }, [market, selectedSystem, selectedClaveNodos]);

  const { data, isLoading, error } = useQuery<PmlYearlyComparisonResponse, Error>({
    queryKey: ["pml-yearly-comparison", market, selectedSystem, timeRange, selectedClaveNodos],
    queryFn: async () => {
      const url = buildApiUrl();
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch PML yearly comparison data");
      return res.json();
    },
  });

  // Click outside handler for ClaveNodo dropdown
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsClaveNodoOpen(false);
      }
    }
    
    if (isClaveNodoOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isClaveNodoOpen]);

  const processYearData = React.useCallback((yearData: Array<{Fecha: string, AvgPML: number}>) => {
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
        y: item.AvgPML,
      };
    });
  }, []);

  const { chartData, currentYear, previousYear } = React.useMemo(() => {
    if (!data?.data) return { 
      chartData: {},
      currentYear: new Date().getFullYear(),
      previousYear: new Date().getFullYear() - 1,
      allDates: []
    };

    // Handle different response structures
    if (selectedClaveNodos.includes("all") && data.data.currentYearData && data.data.previousYearData) {
      // Flat structure for "All" selection - show as aggregated data
      const rawCurrentYearData = data.data.currentYearData;
      const rawPreviousYearData = data.data.previousYearData;
      
      return {
        chartData: {
          "All": {
            currentYearData: rawCurrentYearData,
            previousYearData: rawPreviousYearData
          }
        },
        currentYear: rawCurrentYearData[0]?.Fecha ? parseInt(rawCurrentYearData[0].Fecha.slice(0, 4)) : new Date().getFullYear(),
        previousYear: rawPreviousYearData[0]?.Fecha ? parseInt(rawPreviousYearData[0].Fecha.slice(0, 4)) : new Date().getFullYear() - 1
      };
    } else if (data.data.nodes) {
      // Nested structure for specific ClaveNodo selection - show individual lines
      const chartData: Record<string, { currentYearData: Array<{Fecha: string, AvgPML: number}>, previousYearData: Array<{Fecha: string, AvgPML: number}> }> = {};
      const allDatesSet = new Set<string>();
      
      selectedClaveNodos.forEach(claveNodo => {
        if (claveNodo !== "all" && data.data.nodes![claveNodo]) {
          chartData[claveNodo] = data.data.nodes![claveNodo];
          data.data.nodes![claveNodo].currentYearData.forEach(d => allDatesSet.add(d.Fecha));
          data.data.nodes![claveNodo].previousYearData.forEach(d => allDatesSet.add(d.Fecha));
        }
      });
      
      const firstNode = Object.values(chartData)[0];
      return {
        chartData,
        currentYear: firstNode?.currentYearData[0]?.Fecha ? parseInt(firstNode.currentYearData[0].Fecha.slice(0, 4)) : new Date().getFullYear(),
        previousYear: firstNode?.previousYearData[0]?.Fecha ? parseInt(firstNode.previousYearData[0].Fecha.slice(0, 4)) : new Date().getFullYear() - 1
      };
    }

    
    return {
      chartData: {},
      currentYear: new Date().getFullYear(),
      previousYear: new Date().getFullYear() - 1
    };
  }, [data, timeRange, selectedClaveNodos]);

  // Filter data based on time range and process for chart
  const { processedData, categories } = React.useMemo(() => {
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

    Object.entries(chartData).forEach(([claveNodo, nodeData]) => {
      const filteredCurrentYear = filterByTimeRange(nodeData.currentYearData, true);
      const filteredPreviousYear = filterByTimeRange(nodeData.previousYearData, false);
      
      filteredCurrentYear.forEach(d => allFilteredDates.add(d.Fecha));
      filteredPreviousYear.forEach(d => allFilteredDates.add(d.Fecha));
      
      processedData[claveNodo] = {
        currentYear: processYearData(filteredCurrentYear),
        previousYear: processYearData(filteredPreviousYear)
      };
    });

    // Generate categories from all dates
    const sortedDates = Array.from(allFilteredDates).sort();
    const categories = sortedDates.map(fecha => {
      const monthDay = fecha.slice(5);
      const [month, day] = monthDay.split('-');
      const monthNumber = parseInt(month, 10);
      const dayNumber = parseInt(day, 10);
      const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      return `${monthNames[monthNumber - 1]} ${dayNumber}`;
    });

    return { processedData, categories };
  }, [chartData, timeRange, processYearData]);

  // Generate chart series with colors
  const series = React.useMemo(() => {
    const colors = ['#2db2ac', '#a74044', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#06b6d4', '#f97316', '#84cc16', '#ec4899'];
    const seriesData: any[] = [];
    let colorIndex = 0;

    Object.entries(processedData).forEach(([claveNodo, nodeData]) => {
      // Current year series
      const currentYearColor = colors[colorIndex % colors.length];
      const currentYearData = categories.map(category => {
        const dataPoint = nodeData.currentYear.find(d => d.x === category);
        return dataPoint ? dataPoint.y : null;
      });
      
      seriesData.push({
        name: `${claveNodo} ${currentYear}`,
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
        name: `${claveNodo} ${previousYear}`,
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
    const headers = ['Date', 'ClaveNodo', 'Year', 'PML_USD'];
    csvRows.push(headers.join(','));

    // Process data for CSV
    Object.entries(processedData).forEach(([claveNodo, nodeData]) => {
      // Current year data
      nodeData.currentYear.forEach((dataPoint, index) => {
        if (dataPoint.y !== null) {
          const dateStr = categories[index] || dataPoint.x;
          csvRows.push(`"${dateStr}","${claveNodo}",${currentYear},${dataPoint.y}`);
        }
      });
      
      // Previous year data
      nodeData.previousYear.forEach((dataPoint, index) => {
        if (dataPoint.y !== null) {
          const dateStr = categories[index] || dataPoint.x;
          csvRows.push(`"${dateStr}","${claveNodo}",${previousYear},${dataPoint.y}`);
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
        
        // Add each series data point
        series.forEach((seriesData: number[], index: number) => {
          if (seriesData[dataPointIndex] !== null) {
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
                setSelectedClaveNodos(["all"]); // Reset ClaveNodo when system changes
              }}
              className="w-32"
              placeholder="Sistema"
              options={systemOptions}
            />
            
            {/* Multi-select ClaveNodo Combobox */}
            <div className="relative w-48" ref={dropdownRef}>
              <button
                type="button"
                className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setIsClaveNodoOpen(!isClaveNodoOpen)}
              >
                <span className="truncate">
                  {selectedClaveNodos.includes("all") 
                    ? "All ClaveNodos" 
                    : selectedClaveNodos.length === 0 
                      ? "Select ClaveNodos"
                      : `${selectedClaveNodos.length} selected`
                  }
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </button>
              
              {isClaveNodoOpen && (
                <div className="absolute top-10 z-50 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                  <div className="max-h-60 overflow-auto">
                    {claveNodoOptions.map((option) => {
                      const isSelected = selectedClaveNodos.includes(option.value);
                      const isAll = option.value === "all";
                      
                      return (
                        <div
                          key={option.value}
                          className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                          onClick={() => {
                            if (isAll) {
                              setSelectedClaveNodos(["all"]);
                            } else {
                              setSelectedClaveNodos(prev => {
                                const filtered = prev.filter(item => item !== "all");
                                if (isSelected) {
                                  const newSelection = filtered.filter(item => item !== option.value);
                                  return newSelection.length === 0 ? ["all"] : newSelection;
                                } else {
                                  const newSelection = [...filtered, option.value];
                                  return newSelection.length > 5 ? newSelection.slice(0, 5) : newSelection;
                                }
                              });
                            }
                          }}
                        >
                          <div className="w-4 h-4 border rounded-sm flex items-center justify-center">
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <span className={isAll ? "font-medium" : ""}>{option.label}</span>
                          {!isAll && selectedClaveNodos.length >= 5 && !isSelected && (
                            <span className="text-xs text-muted-foreground ml-auto">Max 5</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t mt-1 pt-1">
                    <button
                      type="button"
                      className="w-full text-xs text-muted-foreground hover:text-foreground px-2 py-1 text-left"
                      onClick={() => setIsClaveNodoOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
            
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
            <div className="text-xs font-medium text-muted-foreground mb-2">Promedios por ClaveNodo:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {Object.entries(processedData).map(([claveNodo, nodeData], index) => {
                const currentAvg = nodeData.currentYear.reduce((sum, item) => sum + (item.y || 0), 0) / (nodeData.currentYear.filter(item => item.y !== null).length || 1);
                const previousAvg = nodeData.previousYear.reduce((sum, item) => sum + (item.y || 0), 0) / (nodeData.previousYear.filter(item => item.y !== null).length || 1);
                const colors = ['#2db2ac', '#a74044', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#06b6d4', '#f97316', '#84cc16', '#ec4899'];
                const color = colors[index % colors.length];
                
                return (
                  <div key={claveNodo} className="space-y-1">
                    <div className="font-medium text-foreground">{claveNodo}</div>
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