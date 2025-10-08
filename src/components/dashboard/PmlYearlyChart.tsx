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
    nodes?: {
      [nodeKey: string]: {
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

interface NodeSearchResponse {
  status: string;
  data: string[]; // Just an array of node claves
}

const systemOptions = [
  { value: "BCA", label: "BCA" },
  { value: "BCS", label: "BCS" },
  { value: "SIN", label: "SIN" },
];

export function PmlYearlyChart() {
  const [selectedSystem, setSelectedSystem] = React.useState("SIN");
  const [market, setMarket] = React.useState("mda");
  const [selectedNodes, setSelectedNodes] = React.useState<string[]>([]);
  const [nodeSearchQuery, setNodeSearchQuery] = React.useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState("");
  const [isNodeDropdownOpen, setIsNodeDropdownOpen] = React.useState(false);

  // Debounce search query to avoid excessive API calls
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(nodeSearchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [nodeSearchQuery]);

  // Build API URL
  const buildApiUrl = React.useCallback(() => {
    const baseUrl = `${import.meta.env.VITE_API_URL}/api/v1/pml/yearly-comparison-by-system?market=${market}&sistema=${selectedSystem}`;
    
    if (selectedNodes.length > 0) {
      const nodeParams = selectedNodes.map(nodeClave => `claveNodo=${encodeURIComponent(nodeClave)}`).join('&');
      return `${baseUrl}&${nodeParams}`;
    }
    
    return baseUrl;
  }, [market, selectedSystem, selectedNodes]);

  // Node search query
  const { data: nodeSearchResults, isLoading: isSearching } = useQuery<NodeSearchResponse, Error>({
    queryKey: ["node-search", debouncedSearchQuery],
    queryFn: async () => {
      if (!debouncedSearchQuery.trim()) return { status: "success", data: [] };
      
      const url = `${import.meta.env.VITE_API_URL}/api/v1/pml/nodos/search?clave=${encodeURIComponent(debouncedSearchQuery)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to search nodes");
      return res.json();
    },
    enabled: debouncedSearchQuery.trim().length > 0,
    staleTime: 30000, // Cache for 30 seconds
  });

  const { data, isLoading, error } = useQuery<PmlYearlyComparisonResponse, Error>({
    queryKey: ["pml-yearly-comparison", market, selectedSystem, selectedNodes],
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
    console.log('Processing chartData...', { hasData: !!data?.data });
    
    if (!data?.data) return { 
      chartData: {},
      currentYear: new Date().getFullYear(),
      previousYear: new Date().getFullYear() - 1
    };

    // Handle nodes response structure (when nodes are selected)
    if (data.data.nodes && Object.keys(data.data.nodes).length > 0) {
      const nodesData = data.data.nodes;
      
      console.log('Processing nodes data:', { 
        nodeCount: Object.keys(nodesData).length, 
        nodes: Object.keys(nodesData)
      });
      
      // Extract years from first node's data
      const firstNodeKey = Object.keys(nodesData)[0];
      const firstNodeData = nodesData[firstNodeKey];
      
      return {
        chartData: nodesData,
        currentYear: firstNodeData.currentYearData[0]?.Fecha ? 
          parseInt(firstNodeData.currentYearData[0].Fecha.slice(0, 4)) : new Date().getFullYear(),
        previousYear: firstNodeData.previousYearData[0]?.Fecha ? 
          parseInt(firstNodeData.previousYearData[0].Fecha.slice(0, 4)) : new Date().getFullYear() - 1
      };
    }

    // Handle flat structure response (system data)
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
  }, [data]);

  // Process data for chart (no time filtering - show full year)
  const { processedData, categories } = React.useMemo(() => {
    console.log('Processing filtered data...', { chartDataKeys: Object.keys(chartData) });
    
    // Early return if no chart data
    if (!chartData || Object.keys(chartData).length === 0) {
      console.log('No chartData, returning empty');
      return { processedData: {}, categories: [] };
    }

    const processedData: Record<string, { currentYear: Array<{x: string, y: number}>, previousYear: Array<{x: string, y: number}> }> = {};
    let allFilteredDates = new Set<string>();

    Object.entries(chartData).forEach(([key, nodeData]) => {
      // Use full year data without time filtering
      const fullCurrentYear = nodeData.currentYearData;
      const fullPreviousYear = nodeData.previousYearData;
      
      // Extract dates as month-day only (without year) to align both years
      fullCurrentYear.forEach((d: any) => {
        const monthDay = d.Fecha.slice(5); // Get "MM-DD" part
        allFilteredDates.add(monthDay);
      });
      fullPreviousYear.forEach((d: any) => {
        const monthDay = d.Fecha.slice(5); // Get "MM-DD" part  
        allFilteredDates.add(monthDay);
      });
      
      // For node data, use the node key directly; for system data, use "Sistema"
      const displayName = key === "Sistema" ? selectedSystem : key;
      
      processedData[displayName] = {
        currentYear: processYearData(fullCurrentYear),
        previousYear: processYearData(fullPreviousYear)
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
  }, [chartData, processYearData, selectedSystem]);

  // Memoize categories separately for performance
  const memoizedCategories = React.useMemo(() => categories, [categories]);

  // Generate chart series with colors - heavily optimized for large datasets
  const series = React.useMemo(() => {
    // Early return if no processed data
    if (!processedData || Object.keys(processedData).length === 0 || !memoizedCategories.length) {
      return [];
    }

    const colors = ['#2db2ac', '#a74044', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#06b6d4', '#f97316', '#84cc16', '#ec4899'];
    const seriesData: any[] = [];
    let colorIndex = 0;

    // Pre-create category lookup for O(1) performance
    const categoryLookup = new Map(memoizedCategories.map((cat, index) => [cat, index]));

    Object.entries(processedData).forEach(([entityName, nodeData]) => {
      // Pre-allocate arrays for better performance
      const currentYearData = new Array(memoizedCategories.length).fill(null);
      const previousYearData = new Array(memoizedCategories.length).fill(null);
      
      // Current year series - optimized mapping
      nodeData.currentYear.forEach(dataPoint => {
        const index = categoryLookup.get(dataPoint.x);
        if (index !== undefined) {
          currentYearData[index] = dataPoint.y;
        }
      });
      
      // Previous year series - optimized mapping  
      nodeData.previousYear.forEach(dataPoint => {
        const index = categoryLookup.get(dataPoint.x);
        if (index !== undefined) {
          previousYearData[index] = dataPoint.y;
        }
      });
      
      const currentYearColor = colors[colorIndex % colors.length];
      const previousYearColor = colors[(colorIndex + 5) % colors.length];
      
      seriesData.push({
        name: `${entityName} ${currentYear}`,
        data: currentYearData,
        color: currentYearColor
      });
      
      seriesData.push({
        name: `${entityName} ${previousYear}`,
        data: previousYearData,
        color: previousYearColor
      });
      
      colorIndex++;
    });

    return seriesData;
  }, [processedData, memoizedCategories, currentYear, previousYear]);

  // Use deferred value for performance optimization - only defer when dataset is large
  const shouldDefer = memoizedCategories.length > 50;
  const deferredSeries = useDeferredValue(shouldDefer ? series : series);
  const deferredCategories = useDeferredValue(shouldDefer ? memoizedCategories : memoizedCategories);

  // Brush chart series - use sampled data for large datasets
  const brushSeries = React.useMemo(() => {
    if (!deferredSeries.length) return [];
    
    // For large datasets, sample every nth point for brush chart
    const sampleRate = memoizedCategories.length > 200 ? Math.ceil(memoizedCategories.length / 100) : 1;
    
    // Use first 2 series for brush chart to reduce complexity
    const mainSeries = deferredSeries.slice(0, Math.min(2, deferredSeries.length));
    
    const sampledSeries = mainSeries.map(serie => ({
      name: serie.name,
      data: sampleRate > 1 
        ? serie.data.filter((_: any, index: number) => index % sampleRate === 0)
        : serie.data,
      color: serie.color
    }));
    
    console.log('Brush chart optimization:', {
      originalPoints: memoizedCategories.length,
      sampleRate,
      brushPoints: sampledSeries[0]?.data.length || 0,
      seriesCount: sampledSeries.length
    });
    
    return sampledSeries;
  }, [deferredSeries, memoizedCategories.length]);

  const brushCategories = React.useMemo(() => {
    // Sample categories to match brush series
    const sampleRate = memoizedCategories.length > 200 ? Math.ceil(memoizedCategories.length / 100) : 1;
    return sampleRate > 1 
      ? deferredCategories.filter((_, index) => index % sampleRate === 0)
      : deferredCategories;
  }, [deferredCategories, memoizedCategories.length]);

  // CSV Download function
  const downloadCSV = React.useCallback(() => {
    if (!data?.data) return;

    const csvRows: string[] = [];
    const headers = ['Date', 'Entity', 'Year', 'PML_USD'];
    csvRows.push(headers.join(','));

    // Process data for CSV
    Object.entries(processedData).forEach(([entityName, nodeData]) => {
      // Current year data
      nodeData.currentYear.forEach((dataPoint, index) => {
        if (dataPoint.y !== null) {
          const dateStr = categories[index] || dataPoint.x;
          csvRows.push(`"${dateStr}","${entityName}",${currentYear},${dataPoint.y}`);
        }
      });
      
      // Previous year data
      nodeData.previousYear.forEach((dataPoint, index) => {
        if (dataPoint.y !== null) {
          const dateStr = categories[index] || dataPoint.x;
          csvRows.push(`"${dateStr}","${entityName}",${previousYear},${dataPoint.y}`);
        }
      });
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const entityType = selectedNodes.length > 0 ? 'nodes' : 'system';
      const entityIdentifier = selectedNodes.length > 0 ? selectedNodes.join('_') : selectedSystem;
      const filename = `pml_yearly_comparison_${entityType}_${market}_${entityIdentifier}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [data, processedData, categories, currentYear, previousYear, market, selectedSystem, selectedNodes]);

  // Node selection handlers - optimized to prevent re-renders
  const handleNodeSelect = React.useCallback((nodeClave: string) => {
    if (selectedNodes.length >= 5) return; // Max 5 nodes
    
    setSelectedNodes(prev => {
      if (prev.includes(nodeClave)) return prev; // No change
      return [...prev, nodeClave];
    });
    
    setNodeSearchQuery("");
    setIsNodeDropdownOpen(false);
  }, [selectedNodes.length]); // Only depend on length, not full array

  const handleNodeRemove = React.useCallback((nodeToRemove: string) => {
    setSelectedNodes(prev => prev.filter(nodeClave => nodeClave !== nodeToRemove));
  }, []);

  const handleNodeSearchChange = React.useCallback((value: string) => {
    setNodeSearchQuery(value);
    setIsNodeDropdownOpen(value.length > 0);
  }, []);

  // Clear nodes when system changes - optimized
  const previousSystem = React.useRef(selectedSystem);
  React.useEffect(() => {
    if (previousSystem.current !== selectedSystem) {
      setSelectedNodes([]);
      setNodeSearchQuery("");
      setIsNodeDropdownOpen(false);
      previousSystem.current = selectedSystem;
    }
  }, [selectedSystem]);

  const chartOptions: ApexOptions = {
    chart: {
      id: 'main-chart',
      type: "area",
      height: 300,
      toolbar: { 
        show: false,
        autoSelected: 'pan'
      },
      fontFamily: "Inter, sans-serif",
      animations: {
        enabled: deferredCategories.length < 100  // Disable animations for large datasets
      },
      zoom: {
        enabled: true,
        type: 'x',
        autoScaleYaxis: true
      },
      selection: {
        enabled: true,
        xaxis: {
          min: 0,
          max: Math.max(0, deferredCategories.length - 1)
        }
      }
    },
    colors: deferredSeries.map(s => s.color),
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: deferredCategories.length > 200 ? 1 : 2,  // Thinner lines for large datasets
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: deferredCategories.length > 200 ? 0.4 : 0.6,  // Lower opacity for performance
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
      categories: deferredCategories,
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
      // Intelligent tick amount based on dataset size
      tickAmount: Math.min(deferredCategories.length, deferredCategories.length > 200 ? 12 : 24),
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
      // Optimize tooltip for large datasets
      followCursor: deferredCategories.length < 200,
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

  // Brush chart options
  const brushChartOptions: ApexOptions = {
    chart: {
      id: 'brush-chart',
      height: 130,
      type: 'area',
      brush: {
        target: 'main-chart',
        enabled: true
      },
      selection: {
        enabled: true,
        xaxis: {
          // Start with full window open
          min: 0,
          max: brushCategories.length - 1
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
      categories: brushCategories,
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
      }
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
        <CardContent className="flex items-center justify-center h-[350px]">
          <p className="text-red-600">Error cargando datos del gráfico: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>
          PML Promedio Diario ({market.toUpperCase()}): {currentYear} vs {previousYear}
          {selectedNodes.length > 0 && ` - ${selectedNodes.length} Nodo${selectedNodes.length > 1 ? 's' : ''}`}
        </CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {selectedNodes.length > 0 
              ? `Comparación anual del Precio Marginal Local por nodos seleccionados en ${selectedSystem}`
              : `Comparación anual del Precio Marginal Local por sistema - ${data?.data?.sistema || selectedSystem}`
            }
          </span>
          <span className="@[440px]/card:hidden">
            PML Anual - {selectedNodes.length > 0 ? `${selectedNodes.length} Nodos` : (data?.data?.sistema || selectedSystem)}
          </span>
        </CardDescription>
        <CardAction>
          <div className="flex gap-2 items-center flex-wrap">
            {/* Chart Actions Menu */}
            <ChartActionsMenu 
              onDownloadCSV={downloadCSV}
              disabled={!data?.data}
            />
            
            {/* Node Search Combobox */}
            <div className="relative">
              <div className="flex flex-col gap-1">
                {/* Selected Nodes */}
                {selectedNodes.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {selectedNodes.map((nodeClave) => (
                      <div
                        key={nodeClave}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                      >
                        <span className="truncate max-w-20" title={nodeClave}>
                          {nodeClave}
                        </span>
                        <button
                          onClick={() => handleNodeRemove(nodeClave)}
                          className="hover:bg-blue-200 rounded-full p-0.5"
                          type="button"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={nodeSearchQuery}
                    onChange={(e) => handleNodeSearchChange(e.target.value)}
                    placeholder={selectedNodes.length >= 5 ? "Máximo 5 nodos" : "Buscar nodo..."}
                    disabled={selectedNodes.length >= 5}
                    className="w-40 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    onFocus={() => nodeSearchQuery && setIsNodeDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsNodeDropdownOpen(false), 200)}
                  />
                  
                  {/* Dropdown Results */}
                  {isNodeDropdownOpen && nodeSearchResults?.data && nodeSearchResults.data.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                      {nodeSearchResults.data
                        .filter(nodeClave => !selectedNodes.includes(nodeClave))
                        .slice(0, 10)
                        .map((nodeClave) => (
                          <button
                            key={nodeClave}
                            onClick={() => handleNodeSelect(nodeClave)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            type="button"
                          >
                            <div className="font-medium">{nodeClave}</div>
                          </button>
                        ))}
                    </div>
                  )}
                  
                  {/* Loading indicator */}
                  {isSearching && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
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
          <div className="space-y-4">
            {/* Main Chart */}
            <Chart
              options={chartOptions}
              series={deferredSeries}
              type="area"
              height={300}
            />
            
            {/* Brush Chart */}
            <div className="border-t pt-4">
              <Chart
                options={brushChartOptions}
                series={brushSeries}
                type="area" 
                height={130}
              />
            </div>
          </div>
        )}
        {data && Object.keys(chartData).length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              {selectedNodes.length > 0 ? 'Promedios por Nodo:' : 'Promedios del Sistema:'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {Object.entries(processedData).map(([entityName, nodeData], index) => {
                const currentAvg = nodeData.currentYear.reduce((sum, item) => sum + (item.y || 0), 0) / (nodeData.currentYear.filter(item => item.y !== null).length || 1);
                const previousAvg = nodeData.previousYear.reduce((sum, item) => sum + (item.y || 0), 0) / (nodeData.previousYear.filter(item => item.y !== null).length || 1);
                const colors = ['#2db2ac', '#a74044', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#06b6d4', '#f97316', '#84cc16', '#ec4899'];
                const color = colors[index % colors.length];
                
                return (
                  <div key={entityName} className="space-y-1">
                    <div className="font-medium text-foreground">{entityName}</div>
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
            <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
              💡 Arrastra en el gráfico inferior para navegar por todo el año ({deferredCategories.length} puntos de datos disponibles)
              {selectedNodes.length > 0 && (
                <div className="mt-1">
                  📊 Mostrando datos de {selectedNodes.length} nodo{selectedNodes.length > 1 ? 's' : ''} seleccionado{selectedNodes.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}