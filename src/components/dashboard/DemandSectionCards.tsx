import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface DemandPeakComparisonResponse {
  absolute_peak_comparison: {
    currentYear: {
      fecha: string;
      hora: number;
      peak_demand_MWh: number;
      sistema: string;
      year: number;
    };
    previousYear: {
      fecha: string;
      hora: number;
      peak_demand_MWh: number;
      sistema: string;
      year: number;
    };
  };
  status: string;
}

function padHour(hour: number) {
  return hour.toString().padStart(2, '0') + ':00';
}

export function DemandSectionCards() {
  const {
    data,
    isLoading,
    error,
  } = useQuery<DemandPeakComparisonResponse, Error>({
    queryKey: ['demand-peak-comparison'],
    queryFn: async () => {
      const url = `${import.meta.env.VITE_API_URL}/api/v1/demanda-real-balance/absolute-peak-comparison`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch demand peak comparison');
      return res.json();
    },
  });

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @lg/card:grid-cols-2">
      {/* Máximo Anual 2024 Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Máximo Anual {isLoading || error || !data ? '2024' : data.absolute_peak_comparison.previousYear.year}</CardDescription>
          <CardTitle className="text-2xl font-semibold text-blue-600 tabular-nums @[250px]/card:text-3xl">
            {isLoading || error || !data
              ? '--'
              : `${data.absolute_peak_comparison.previousYear.peak_demand_MWh.toLocaleString('en-US', { maximumFractionDigits: 0 })} MW`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Zap />
              Pico {isLoading || error || !data ? '2024' : data.absolute_peak_comparison.previousYear.year}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isLoading || error || !data
              ? '--'
              : `Registrado el ${data.absolute_peak_comparison.previousYear.fecha} a las ${padHour(data.absolute_peak_comparison.previousYear.hora)}`}
            <TrendingUp className="size-4 text-blue-600" />
          </div>
          <div className="text-muted-foreground">
            {isLoading || error || !data
              ? ''
              : `Sistema: ${data.absolute_peak_comparison.previousYear.sistema}`}
          </div>
        </CardFooter>
      </Card>

      {/* Máximo Anual 2025 Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Máximo Anual {isLoading || error || !data ? '2025' : data.absolute_peak_comparison.currentYear.year}</CardDescription>
          <CardTitle className="text-2xl font-semibold text-green-600 tabular-nums @[250px]/card:text-3xl">
            {isLoading || error || !data
              ? '--'
              : `${data.absolute_peak_comparison.currentYear.peak_demand_MWh.toLocaleString('en-US', { maximumFractionDigits: 0 })} MW`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Zap />
              Pico {isLoading || error || !data ? '2025' : data.absolute_peak_comparison.currentYear.year}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isLoading || error || !data
              ? '--'
              : `Registrado el ${data.absolute_peak_comparison.currentYear.fecha} a las ${padHour(data.absolute_peak_comparison.currentYear.hora)}`}
            <TrendingUp className="size-4 text-green-600" />
          </div>
          <div className="text-muted-foreground">
            {isLoading || error || !data
              ? ''
              : `Sistema: ${data.absolute_peak_comparison.currentYear.sistema}`}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}