import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ServiciosAverageResponse {
  data: {
    average_price: number;
    endDate: string;
    market: string;
    startDate: string;
    sistema: string;
  };
  status: string;
}

interface ServiciosExtremesResponse {
  data: {
    market: string;
    max: {
      FechaOperacion: string;
      HoraOperacion: number;
      PrecioReserva_MW_Hora: number;
      TipoReserva: string;
      ZonaReserva: string;
    };
    min: {
      FechaOperacion: string;
      HoraOperacion: number;
      PrecioReserva_MW_Hora: number;
      TipoReserva: string;
      ZonaReserva: string;
    };
    sistema: string;
  };
  status: string;
}

interface ServiciosComparisonResponse {
  data: {
    current_month_overall_average: number;
    market: string;
    percentage_change: number;
    previous_month_average: number;
    sistema: string;
    trend: 'positive' | 'negative';
  };
  status: string;
}

function padHour(hour: number) {
  return hour.toString().padStart(2, '0') + ':00';
}

export function ServiciosConexosSectionCards() {
  const {
    data: averageData,
    isLoading: averageLoading,
    error: averageError,
  } = useQuery<ServiciosAverageResponse, Error>({
    queryKey: ['servicios-average', 'mda', 'SIN'],
    queryFn: async () => {
      const url = `${import.meta.env.VITE_API_URL}/api/v1/servicios-conexos/current-month-average?market=mda&sistema=SIN`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch servicios average');
      return res.json();
    },
  });

  const {
    data: extremesData,
    isLoading: extremesLoading,
    error: extremesError,
  } = useQuery<ServiciosExtremesResponse, Error>({
    queryKey: ['servicios-extremes', 'mda', 'SIN'],
    queryFn: async () => {
      const url = `${import.meta.env.VITE_API_URL}/api/v1/servicios-conexos/current-month-extremes?market=mda&sistema=SIN`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch servicios extremes');
      return res.json();
    },
  });

  const {
    data: comparisonData,
    isLoading: comparisonLoading,
    error: comparisonError,
  } = useQuery<ServiciosComparisonResponse, Error>({
    queryKey: ['servicios-comparison', 'mda', 'SIN'],
    queryFn: async () => {
      const url = `${import.meta.env.VITE_API_URL}/api/v1/servicios-conexos/comparison/month-over-month?market=mda&sistema=SIN`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch servicios comparison');
      return res.json();
    },
  });

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-4 @5xl/main:grid-cols-4 grid-cols-4">
      {/* Promedio Mensual Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Promedio Mensual - Servicios Conexos (MDA)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {averageLoading || averageError || !averageData
              ? '--'
              : `$${averageData.data.average_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              Promedio
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Precio promedio del mes <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {averageLoading || averageError || !averageData
              ? ''
              : `Del ${averageData.data.startDate} al ${averageData.data.endDate} - Sistema: ${averageData.data.sistema}`}
          </div>
        </CardFooter>
      </Card>

      {/* Variación vs Mes Pasado Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Variación vs Mes Pasado - Servicios Conexos (MDA)</CardDescription>
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
              : `Mes anterior: $${comparisonData.data.previous_month_average.toFixed(2)} - Sistema: ${comparisonData.data.sistema}`}
          </div>
        </CardFooter>
      </Card>

      {/* Máximo del Mes Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Máximo del Mes - Servicios Conexos (MDA)</CardDescription>
          <CardTitle className="text-2xl font-semibold text-red-600 tabular-nums @[250px]/card:text-3xl">
            {extremesLoading || extremesError || !extremesData
              ? '--'
              : `$${extremesData.data.max.PrecioReserva_MW_Hora.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
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
            {extremesLoading || extremesError || !extremesData
              ? '--'
              : `Registrado el ${extremesData.data.max.FechaOperacion} a las ${padHour(extremesData.data.max.HoraOperacion)}`}
            <TrendingUp className="size-4 text-red-600" />
          </div>
          <div className="text-muted-foreground">
            {extremesLoading || extremesError || !extremesData
              ? ''
              : `Tipo: ${extremesData.data.max.TipoReserva}`}
          </div>
          <div className="text-muted-foreground">
            {extremesLoading || extremesError || !extremesData
              ? '--'
              : `Zona: ${extremesData.data.max.ZonaReserva}`}
          </div>
        </CardFooter>
      </Card>

      {/* Mínimo del Mes Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Mínimo del Mes - Servicios Conexos (MDA)</CardDescription>
          <CardTitle className="text-2xl font-semibold text-green-600 tabular-nums @[250px]/card:text-3xl">
            {extremesLoading || extremesError || !extremesData
              ? '--'
              : `$${extremesData.data.min.PrecioReserva_MW_Hora.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
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
            {extremesLoading || extremesError || !extremesData
              ? '--'
              : `Registrado el ${extremesData.data.min.FechaOperacion} a las ${padHour(extremesData.data.min.HoraOperacion)}`}
            <TrendingDown className="size-4 text-green-600" />
          </div>
          <div className="text-muted-foreground">
            {extremesLoading || extremesError || !extremesData
              ? ''
              : `Tipo: ${extremesData.data.min.TipoReserva}`}
          </div>
          <div className="text-muted-foreground">
            {extremesLoading || extremesError || !extremesData
              ? '--'
              : `Zona: ${extremesData.data.min.ZonaReserva}`}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}