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
  filter: {
    gerencia: string;
  };
  peak_demand_current_year: {
    demanda: number;
    fecha: string;
    hora: number;
    year: number;
  };
  peak_demand_previous_year: {
    demanda: number;
    fecha: string;
    hora: number;
    year: number;
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
    queryKey: ['demand-peak-comparison', 'all'],
    queryFn: async () => {
      const url = `${import.meta.env.VITE_API_URL}/api/v1/demanda/peak-demand-comparison?gerencia=all`;
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
          <CardDescription>Máximo Anual 2024</CardDescription>
          <CardTitle className="text-2xl font-semibold text-blue-600 tabular-nums @[250px]/card:text-3xl">
            {isLoading || error || !data
              ? '--'
              : `${data.peak_demand_previous_year.demanda.toLocaleString('en-US', { maximumFractionDigits: 0 })} MW`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Zap />
              Pico 2024
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isLoading || error || !data
              ? '--'
              : `Registrado el ${data.peak_demand_previous_year.fecha} a las ${padHour(data.peak_demand_previous_year.hora)}`}
            <TrendingUp className="size-4 text-blue-600" />
          </div>
          <div className="text-muted-foreground">
            {isLoading || error || !data
              ? ''
              : `Gerencia: ${data.filter.gerencia}`}
          </div>
        </CardFooter>
      </Card>

      {/* Máximo Anual 2025 Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Máximo Anual 2025</CardDescription>
          <CardTitle className="text-2xl font-semibold text-green-600 tabular-nums @[250px]/card:text-3xl">
            {isLoading || error || !data
              ? '--'
              : `${data.peak_demand_current_year.demanda.toLocaleString('en-US', { maximumFractionDigits: 0 })} MW`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Zap />
              Pico 2025
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isLoading || error || !data
              ? '--'
              : `Registrado el ${data.peak_demand_current_year.fecha} a las ${padHour(data.peak_demand_current_year.hora)}`}
            <TrendingUp className="size-4 text-green-600" />
          </div>
          <div className="text-muted-foreground">
            {isLoading || error || !data
              ? ''
              : `Gerencia: ${data.filter.gerencia}`}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}