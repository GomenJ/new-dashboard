# Making Components Reusable with TanStack Query

This guide shows how to refactor dashboard components to be reusable with TanStack Query for better data management, caching, and loading states.

## 📁 File Structure

```
src/
├── api/
│   └── dashboardApi.ts          # API functions and types
├── hooks/
│   └── useDashboard.ts          # Custom TanStack Query hooks
├── providers/
│   └── QueryProvider.tsx       # Query client setup
└── components/dashboard/
    ├── Metrics.tsx              # Refactored with props
    ├── MonthlySalesChart.tsx    # Refactored with props
    └── MonthlyTarget.tsx        # Refactored with props
```

## 🔧 Key Components

### 1. API Layer (`api/dashboardApi.ts`)
- Centralized API functions
- TypeScript interfaces for data types
- Mock data with simulated delays
- Easy to replace with real API calls

### 2. Custom Hooks (`hooks/useDashboard.ts`)
- Query keys for cache management
- Individual hooks for each data type
- Configurable stale times and cache times
- Combined hook for all dashboard data

### 3. Query Provider (`providers/QueryProvider.tsx`)
- Centralized QueryClient configuration
- Development tools integration
- Consistent retry and stale time policies

## 🎯 Benefits

### ✅ **Reusability**
- Components accept data as props
- No hardcoded data in components
- Easy to use in different contexts

### ✅ **Performance**
- Automatic caching with TanStack Query
- Background refetching
- Optimistic updates support

### ✅ **Developer Experience**
- Built-in loading and error states
- TypeScript support
- Query devtools integration

### ✅ **Maintainability**
- Separation of concerns
- Centralized data fetching logic
- Easy to test components independently

## 🚀 Usage Examples

### Basic Usage
```tsx
import { useMetrics } from '../hooks/useDashboard';
import EcommerceMetrics from '../components/dashboard/Metrics';

function Dashboard() {
  const metricsQuery = useMetrics();
  
  return (
    <EcommerceMetrics 
      data={metricsQuery.data}
      isLoading={metricsQuery.isLoading}
      isError={metricsQuery.isError}
    />
  );
}
```

### Advanced Usage with All Data
```tsx
import { useDashboardData } from '../hooks/useDashboard';

function Dashboard() {
  const {
    metrics,
    monthlySales,
    monthlyTarget,
    isLoading,
    isError
  } = useDashboardData();
  
  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorMessage />;
  
  return (
    <div>
      <EcommerceMetrics {...metrics} />
      <MonthlySalesChart {...monthlySales} />
      <MonthlyTarget {...monthlyTarget} />
    </div>
  );
}
```

## 🔄 Extending for Other Components

To make other components reusable:

1. **Add API function** in `dashboardApi.ts`
2. **Create custom hook** in `useDashboard.ts`
3. **Update component** to accept props
4. **Add loading/error states** to component
5. **Use in pages** with the new hook

### Example: Making StatisticsChart Reusable

```tsx
// 1. Add to dashboardApi.ts
export const dashboardApi = {
  // ...existing methods
  getStatistics: async (): Promise<ChartData[]> => {
    // API call here
  }
};

// 2. Add to useDashboard.ts
export const useStatistics = () => {
  return useQuery({
    queryKey: dashboardKeys.statistics(),
    queryFn: dashboardApi.getStatistics,
    staleTime: 5 * 60 * 1000,
  });
};

// 3. Update component
interface StatisticsChartProps {
  data?: ChartData[];
  isLoading?: boolean;
  isError?: boolean;
}

export default function StatisticsChart({ data, isLoading, isError }: StatisticsChartProps) {
  // Add loading/error states
  // Use data prop instead of hardcoded data
}

// 4. Use in pages
const statisticsQuery = useStatistics();
<StatisticsChart 
  data={statisticsQuery.data}
  isLoading={statisticsQuery.isLoading}
  isError={statisticsQuery.isError}
/>
```

## 🛠️ Configuration Options

### Query Configuration
```tsx
// In useDashboard.ts
export const useMetrics = (options?: UseQueryOptions) => {
  return useQuery({
    queryKey: dashboardKeys.metrics(),
    queryFn: dashboardApi.getMetrics,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000, // Auto-refetch every 30s
    ...options // Allow custom options
  });
};
```

### Cache Management
```tsx
import { useQueryClient } from '@tanstack/react-query';
import { dashboardKeys } from '../hooks/useDashboard';

// Invalidate specific data
const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: dashboardKeys.metrics() });

// Prefetch data
queryClient.prefetchQuery({
  queryKey: dashboardKeys.monthlySales(),
  queryFn: dashboardApi.getMonthlySales,
});
```

## 🔍 Testing

Components are now easier to test since they accept data as props:

```tsx
import { render } from '@testing-library/react';
import EcommerceMetrics from './Metrics';

test('renders metrics correctly', () => {
  const mockData = [
    {
      id: '1',
      label: 'Test Metric',
      value: 1000,
      trend: { direction: 'up', percentage: 10 },
      icon: 'group'
    }
  ];
  
  render(<EcommerceMetrics data={mockData} />);
  // Test assertions here
});
```

This refactoring makes your components more flexible, performant, and maintainable while leveraging the full power of TanStack Query for data management.
