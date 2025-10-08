import * as React from "react";
import { useDeferredValue } from "react";
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

interface PmlComparisonResponse {
  status: string;
  data: {
    market: string;
    current_month_overall_average: number;
    previous_month_average: number;
    percentage_change: number;
    trend: "positive" | "negative";
    current_month_daily_averages: Array<{
      date: string;
      overall_average_pml: number;
      nodes_average_pml: Array<{
        average_pml: number;
        clave_nodo: string;
        nombre_nodo: string;
      }>;
    }>;
    current_month_range: {
      start: string;
      end: string;
    };
    previous_month_range: {
      start: string;
      end: string;
    };
  };
}

interface ChartData {
  labels: string[];
  series: Record<string, number[]>;
}

interface NodeInfo {
  clave: string;
  nombre: string;
}

export function PmlChart() {
  const [timeRange, setTimeRange] = React.useState("full");
  const [market, setMarket] = React.useState("mda");

  const { data, isLoading, error } = useQuery<PmlComparisonResponse, Error>({
    queryKey: ["pml-daily-comparison", market],
    queryFn: async () => {
      const url = `${import.meta.env.VITE_API_URL}/api/v1/pml/comparison/month-over-month?market=${market}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch PML comparison data");
      return res.json();
    },
  });

  const { chartData, nodeNames } = React.useMemo((): { chartData: ChartData; nodeNames: NodeInfo[] } => {
    if (!data?.data?.current_month_daily_averages) {
      return { 
        chartData: { labels: [], series: {} }, 
        nodeNames: [] 
      };
    }
    
    const dailyData = data.data.current_month_daily_averages;
    
    // Extract day labels
    const dayLabels = dailyData.map((item) => {
      const dayString = item.date.slice(-2);
      const day = parseInt(dayString, 10);
      return `Día ${day}`;
    });
    
    // Get all unique nodes from the first day to establish consistent series
    const firstDayNodes = dailyData[0]?.nodes_average_pml || [];
    const uniqueNodes: NodeInfo[] = firstDayNodes.map(node => ({
      clave: node.clave_nodo,
      nombre: node.nombre_nodo
    }));
    
    // Create series data structure
    const seriesData: Record<string, number[]> = {
      overall: dailyData.map(item => item.overall_average_pml)
    };
    
    // Add series for each node
    uniqueNodes.forEach(node => {
      seriesData[node.clave] = dailyData.map(item => {
        const nodeData = item.nodes_average_pml.find(n => n.clave_nodo === node.clave);
        return nodeData ? nodeData.average_pml : 0;
      });
    });
    
    return { 
      chartData: { labels: dayLabels, series: seriesData }, 
      nodeNames: uniqueNodes 
    };
  }, [data]);

  // CSV Download function
  const downloadCSV = React.useCallback(() => {
    if (!data?.data || !chartData.labels) return;

    const csvRows: string[] = [];
    const headers = ['Date', 'Series', 'PML_USD'];
    csvRows.push(headers.join(','));

    // Add overall average data
    chartData.labels.forEach((label, index) => {
      csvRows.push(`"${label}","Overall Average",${chartData.series.overall[index]}`);
    });

    // Add node data
    nodeNames.forEach(node => {
      chartData.labels.forEach((label, index) => {
        csvRows.push(`"${label}","${node.nombre} (${node.clave})",${chartData.series[node.clave][index]}`);
      });
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const filename = `pml_daily_${market}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [data, chartData, nodeNames, market]);

  const filteredData = React.useMemo(() => {
    if (!chartData.labels || timeRange === "full") return chartData;
    
    const days = parseInt(timeRange.replace("d", ""));
    const filteredLabels = chartData.labels.slice(-days);
    const filteredSeries: Record<string, number[]> = {};
    
    Object.keys(chartData.series).forEach(key => {
      filteredSeries[key] = chartData.series[key].slice(-days);
    });
    
    return { labels: filteredLabels, series: filteredSeries };
  }, [chartData, timeRange]);

  const series = React.useMemo(() => {
    if (!filteredData.series) return [];
    
    const seriesArray = [];
    
    // Add overall average series first
    seriesArray.push({
      name: "PML Promedio General",
      data: filteredData.series.overall || [],
    });
    
    // Add individual node series
    nodeNames.forEach((node) => {
      seriesArray.push({
        name: `${node.nombre}`,
        data: filteredData.series[node.clave] || [],
      });
    });
    
    return seriesArray;
  }, [filteredData, nodeNames]);

  // Use deferred value for performance optimization
  const deferredSeries = useDeferredValue(series);
  const deferredLabels = useDeferredValue(filteredData.labels || []);

  // Brush chart series - use simplified data for performance
  const brushSeries = React.useMemo(() => {
    if (!deferredSeries.length) return [];
    
    // Use only the first 3 most important series (overall + top 2 nodes) for brush chart
    const mainSeries = deferredSeries.slice(0, Math.min(3, deferredSeries.length));
    
    return mainSeries.map(serie => ({
      name: serie.name,
      data: serie.data,
      color: ["#2db2ac", "#a74044", "#f59e0b"][deferredSeries.indexOf(serie)] || "#2db2ac"
    }));
  }, [deferredSeries]);

  const brushLabels = React.useMemo(() => {
    return deferredLabels;
  }, [deferredLabels]);

  const chartOptions: ApexOptions = {
    chart: {
      id: 'main-chart',
      type: "area",
      height: 250,
      toolbar: { 
        show: false,
        autoSelected: 'pan'
      },
      fontFamily: "Inter, sans-serif",
      animations: {
        enabled: false  // Disable animations for better performance
      },
      zoom: {
        enabled: true,
        type: 'x',
        autoScaleYaxis: true
      },
      selection: {
        enabled: true,
        xaxis: {
          // Fit selection to actual data range, not from 0
          min: 1,
          max: deferredLabels.length
        }
      }
    },
    colors: ["#2db2ac", "#a74044", "#f59e0b", "#8b5cf6", "#10b981", "#ef4444", "#06b6d4", "#f97316"],
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.8,
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
      categories: deferredLabels,
      labels: {
        style: {
          colors: "hsl(var(--muted-foreground))",
          fontSize: "12px",
        },
      },
      tickAmount: Math.min(deferredLabels.length, 15),
      axisBorder: { show: false },
      axisTicks: { show: false },
      // Only set bounds if we have data, and fit to actual range
      ...(deferredLabels.length > 0 && {
        min: 1,
        max: deferredLabels.length
      })
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
            background: linear-gradient(135deg, #2db2ac 0%, #1a9b94 100%);
            color: white;
            padding: 10px 12px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(45, 178, 172, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
            font-family: Inter, sans-serif;
            min-width: 200px;
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
      horizontalAlign: "center",
      labels: {
        colors: "hsl(var(--muted-foreground))",
      },
    },
  };

  // Brush chart options
  const brushChartOptions: ApexOptions = {
    chart: {
      id: 'brush-chart',
      height: 100,
      type: 'area',
      brush: {
        target: 'main-chart',
        enabled: true
      },
      selection: {
        enabled: true,
        xaxis: {
          // Fit brush selection to actual data range
          min: 1,
          max: brushLabels.length
        }
      },
      animations: {
        enabled: false  // Disable animations for better performance
      },
      toolbar: {
        show: false
      }
    },
    colors: brushSeries.map(s => s.color),
    stroke: {
      width: 1,
      curve: 'smooth'
    },
    fill: {
      type: 'gradient',
      gradient: {
        opacityFrom: 0.4,
        opacityTo: 0.1,
      }
    },
    markers: {
      size: 0  // Remove markers for performance
    },
    xaxis: {
      categories: brushLabels,
      tooltip: {
        enabled: false
      },
      labels: {
        show: false
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      },
      // Only set bounds if we have data, and fit to actual range
      ...(brushLabels.length > 0 && {
        min: 1,
        max: brushLabels.length
      })
    },
    yaxis: {
      max: brushSeries.length > 0 ? Math.max(...brushSeries.flatMap(s => s.data.filter((d: any) => d !== null && d !== undefined))) : 100,
      tickAmount: 2,
      labels: {
        show: false
      }
    },
    tooltip: {
      enabled: false
    },
    legend: {
      show: false
    },
    grid: {
      show: false
    },
    dataLabels: {
      enabled: false
    }
  };

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
        <CardTitle>Evolución Diaria del PML - {market.toUpperCase()}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Promedio diario del Precio Marginal Local del mes actual
          </span>
          <span className="@[540px]/card:hidden">PML Diario - Mes Actual</span>
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
          <div className="flex flex-col items-center justify-center h-[250px] space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2db2ac]"></div>
            <p className="text-sm text-muted-foreground animate-pulse">Cargando datos del gráfico...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Main Chart */}
            <Chart
              options={chartOptions}
              series={deferredSeries}
              type="area"
              height={250}
            />
            
            {/* Brush Chart - Only show if we have enough data points to make it useful */}
            {deferredLabels.length > 3 && (
              <div className="border-t pt-3">
                <Chart
                  options={brushChartOptions}
                  series={brushSeries}
                  type="area" 
                  height={100}
                />
              </div>
            )}
          </div>
        )}
        {data && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Promedio del mes: ${data.data.current_month_overall_average.toFixed(2)}
              </span>
              <span className={`${
                data.data.trend === "positive" ? "text-green-600" : "text-red-600"
              }`}>
                {data.data.trend === "positive" ? "↗" : "↘"} {data.data.percentage_change.toFixed(2)}% vs mes anterior
              </span>
            </div>
            <div className="text-xs text-muted-foreground pt-2 border-t">
              {deferredLabels.length > 3 ? (
                <>💡 Arrastra en el gráfico inferior para navegar por los datos diarios ({deferredLabels.length} días disponibles)</>
              ) : (
                <>📊 Mostrando {deferredLabels.length} días de datos disponibles</>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}