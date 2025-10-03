import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
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

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @lg/card:grid-cols-3 @lg/card:justify-center">
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
    </div>
  );
}