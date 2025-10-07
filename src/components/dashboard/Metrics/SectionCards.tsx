import { useQuery } from '@tanstack/react-query';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ExtremesResponse {
  data: {
    market: string;
    max: {
      FechaOperacion: string;
      HoraOperacion: number;
      PrecioMarginalLocal_MWh: number;
      Sistema: string;
      ZonaCarga: string;
    };
    min: {
      FechaOperacion: string;
      HoraOperacion: number;
      PrecioMarginalLocal_MWh: number;
      Sistema: string;
      ZonaCarga: string;
    };
  };
  status: string;
}

interface AverageResponse {
  data: {
    averagePML: number;
    endDate: string;
    market: string;
    startDate: string;
  };
  status: string;
}

interface ComparisonResponse {
  data: {
    current_month_average: number;
    current_month_range: {
      end: string;
      start: string;
    };
    market: string;
    percentage_change: number;
    previous_month_average: number;
    previous_month_range: {
      end: string;
      start: string;
    };
    trend: 'positive' | 'negative';
  };
  status: string;
}

function padHour(hour: number) {
  return hour.toString().padStart(2, '0') + ':00';
}

export function SectionCards() {
  const { data, isLoading, error } = useQuery<ExtremesResponse, Error>({
    queryKey: ['pml-extremes', 'mda'],
    queryFn: async () => {
      const url = `${import.meta.env.VITE_API_URL}/api/v1/pml/current-month-extremes?market=mda`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch extremes');
      return res.json();
    },
  });

  const {
    data: averageData,
    isLoading: averageLoading,
    error: averageError,
  } = useQuery<AverageResponse, Error>({
    queryKey: ['pml-average', 'mda'],
    queryFn: async () => {
      const url = `${import.meta.env.VITE_API_URL}/api/v1/pml/current-month-average?market=mda`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch average');
      return res.json();
    },
  });

  const {
    data: comparisonData,
    isLoading: comparisonLoading,
    error: comparisonError,
  } = useQuery<ComparisonResponse, Error>({
    queryKey: ['pml-comparison', 'mda'],
    queryFn: async () => {
      const url = `${import.meta.env.VITE_API_URL}/api/v1/pml/comparison/month-over-month?market=mda`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch comparison');
      return res.json();
    },
  });

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Promedio Mensual Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Promedio Mensual - MDA</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {averageLoading || averageError || !averageData
              ? '--'
              : `$${averageData.data.averagePML.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Precio promedio del mes 
          </div>
          <div className="text-muted-foreground">
            {averageLoading || averageError || !averageData
              ? ''
              : `Del ${averageData.data.startDate} al ${averageData.data.endDate}`}
          </div>
        </CardFooter>
      </Card>
      {/* Variación vs Mes Pasado Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Variación vs Mes Pasado - MDA</CardDescription>
          <CardTitle
            className={`text-2xl font-semibold tabular-nums @[250px]/card:text-3xl ${
              comparisonLoading || comparisonError || !comparisonData
                ? ''
                : comparisonData.data.trend === 'positive'
                  ? 'text-green-600'
                  : 'text-red-600'
            }`}
          >
            {comparisonLoading || comparisonError || !comparisonData
              ? '--'
              : `${comparisonData.data.percentage_change > 0 ? '+' : ''}${comparisonData.data.percentage_change.toFixed(2)}%`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {comparisonLoading || comparisonError || !comparisonData ? (
                <TrendingUp />
              ) : comparisonData.data.trend === 'positive' ? (
                <TrendingUp />
              ) : (
                <TrendingDown />
              )}
              {comparisonLoading || comparisonError || !comparisonData
                ? '--'
                : comparisonData.data.trend === 'positive'
                  ? 'Incremento'
                  : 'Disminución'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {comparisonLoading || comparisonError || !comparisonData ? (
              '--'
            ) : comparisonData.data.trend === 'positive' ? (
              <>
                Subió respecto al mes anterior{' '}
                <TrendingUp className="size-4 text-green-600" />
              </>
            ) : (
              <>
                Bajó respecto al mes anterior{' '}
                <TrendingDown className="size-4 text-red-600" />
              </>
            )}
          </div>
          <div className="text-muted-foreground">
            {comparisonLoading || comparisonError || !comparisonData
              ? ''
              : `Mes anterior: $${comparisonData.data.previous_month_average.toFixed(2)}`}
          </div>
        </CardFooter>
      </Card>

      {/* Maximo del Mes Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Máximo del Mes - MDA</CardDescription>
          <CardTitle className="text-2xl font-semibold text-red-600 tabular-nums @[250px]/card:text-3xl">
            {isLoading || error || !data
              ? '--'
              : `$${data.data.max.PrecioMarginalLocal_MWh.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              Pico máximo
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isLoading || error || !data
              ? '--'
              : `Registrado el ${data.data.max.FechaOperacion} a las ${padHour(data.data.max.HoraOperacion)}`}
            <TrendingUp className="size-4 text-red-600" />
          </div>
          <div className="text-muted-foreground">
            {isLoading || error || !data
              ? ''
              : `Sistema: ${data.data.max.Sistema}`}
          </div>
          <div className="text-muted-foreground">
            {isLoading || error || !data
              ? '--'
              : `Zona Carga: ${data.data.max.ZonaCarga}`}
          </div>
        </CardFooter>
      </Card>
      {/* Minimo del Mes Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Mínimo del Mes - MDA</CardDescription>
          <CardTitle className="text-2xl font-semibold text-green-600 tabular-nums @[250px]/card:text-3xl">
            {isLoading || error || !data
              ? '--'
              : `$${data.data.min.PrecioMarginalLocal_MWh.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingDown />
              Precio más bajo
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isLoading || error || !data
              ? '--'
              : `Registrado el ${data.data.min.FechaOperacion} a las ${padHour(data.data.min.HoraOperacion)}`}
            <TrendingDown className="size-4 text-green-600" />
          </div>
          <div className="text-muted-foreground">
            {isLoading || error || !data
              ? '--'
              : `Sistema: ${data.data.min.Sistema}`}
          </div>
          <div className="text-muted-foreground">
            {isLoading || error || !data
              ? '--'
              : `Zona Carga: ${data.data.min.ZonaCarga}`}
          </div>

        </CardFooter>
      </Card>
    </div>
  );
}
