import { useQuery } from "@tanstack/react-query";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardAction,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface ExtremesResponse {
    data: {
        market: string;
        max: {
            FechaOperacion: string;
            HoraOperacion: number;
            PrecioMarginalLocal_MWh: number;
            Sistema: string;
        };
        min: {
            FechaOperacion: string;
            HoraOperacion: number;
            PrecioMarginalLocal_MWh: number;
            Sistema: string;
        };
    };
    status: string;
}

function padHour(hour: number) {
    return hour.toString().padStart(2, "0") + ":00";
}

export function SectionCards() {
    const { data, isLoading, error } = useQuery<ExtremesResponse, Error>({
        queryKey: ["pml-extremes", "mda"],
        queryFn: async () => {
            const url = `${import.meta.env.VITE_API_URL}/api/v1/pml/current-month-extremes?market=mda`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch extremes");
            return res.json();
        },
    });

    return (
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            {/* Dummy Card 1 */}
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Total Revenue</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        $1,250.00
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            <TrendingUp />
                            +12.5%
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        Trending up this month <TrendingUp className="size-4" />
                    </div>
                    <div className="text-muted-foreground">
                        Visitors for the last 6 months
                    </div>
                </CardFooter>
            </Card>
            {/* Dummy Card 2 */}
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>New Customers</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        1,234
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            <TrendingDown />
                            -20%
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        Down 20% this period <TrendingDown className="size-4" />
                    </div>
                    <div className="text-muted-foreground">
                        Acquisition needs attention
                    </div>
                </CardFooter>
            </Card>
            {/* Maximo del Mes Card */}
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Máximo del Mes</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums text-red-600 @[250px]/card:text-3xl">
                        {isLoading || error || !data ? "--" : `$${data.data.max.PrecioMarginalLocal_MWh.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
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
                        {isLoading || error || !data ? "--" : `Registrado el ${data.data.max.FechaOperacion} a las ${padHour(data.data.max.HoraOperacion)}`}
                        <TrendingUp className="size-4 text-red-600" />
                    </div>
                    <div className="text-muted-foreground">
                        {isLoading || error || !data ? "" : `Sistema: ${data.data.max.Sistema}`}
                    </div>
                </CardFooter>
            </Card>
            {/* Minimo del Mes Card */}
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Mínimo del Mes</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums text-green-600 @[250px]/card:text-3xl">
                        {isLoading || error || !data ? "--" : `$${data.data.min.PrecioMarginalLocal_MWh.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
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
                        {isLoading || error || !data ? "--" : `Registrado el ${data.data.min.FechaOperacion} a las ${padHour(data.data.min.HoraOperacion)}`}
                        <TrendingDown className="size-4 text-green-600" />
                    </div>
                    <div className="text-muted-foreground">
                        {isLoading || error || !data ? "" : `Sistema: ${data.data.min.Sistema}`}
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
