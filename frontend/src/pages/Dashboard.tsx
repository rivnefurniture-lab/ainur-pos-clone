import { useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import { Calendar, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/useRedux';
import MainLayout from '../components/Layout/MainLayout';
import { documentApi, dataApi } from '../services/api';
import { theme } from '../styles/GlobalStyles';
import type { Document, Store } from '../types';

// ============================================
// Styled Components
// ============================================

const DashboardContainer = styled.div`
  padding: 0;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 24px;
  font-size: 22px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
`;

const TitleText = styled.span``;

const TitleDropdown = styled.div`
  position: relative;
  display: inline-block;
`;

const TitleDropdownButton = styled.button`
  font-size: 22px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  background: none;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-bottom: 1px dashed ${theme.colors.textSecondary};
  padding: 0;
  
  &:hover {
    color: ${theme.colors.primary};
    border-color: ${theme.colors.primary};
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const DropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  box-shadow: ${theme.shadows.lg};
  min-width: 200px;
  z-index: 100;
  display: ${props => props.isOpen ? 'block' : 'none'};
`;

const DropdownItem = styled.button<{ active?: boolean }>`
  display: block;
  width: 100%;
  padding: 10px 16px;
  text-align: left;
  background: ${props => props.active ? theme.colors.primaryLight : 'transparent'};
  border: none;
  font-size: 14px;
  font-weight: ${props => props.active ? '600' : '400'};
  color: ${theme.colors.textPrimary};
  cursor: pointer;
  
  &:hover {
    background: ${theme.colors.gray100};
  }
  
  &:first-child {
    border-radius: 6px 6px 0 0;
  }
  
  &:last-child {
    border-radius: 0 0 6px 6px;
  }
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 24px;
  margin-bottom: 24px;
`;

const MetricsPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const MetricCard = styled.button<{ active?: boolean }>`
  background: white;
  padding: 16px 20px;
  border: none;
  border-left: 3px solid ${props => props.active ? theme.colors.primary : 'transparent'};
  box-shadow: ${theme.shadows.sm};
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:first-child {
    border-radius: 8px 8px 0 0;
  }
  
  &:last-child {
    border-radius: 0 0 8px 8px;
  }
  
  &:hover {
    background: ${theme.colors.gray50};
  }
  
  ${props => props.active && `
    background: ${theme.colors.gray50};
  `}
`;

const MetricValue = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin-bottom: 4px;
`;

const MetricLabel = styled.div`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const HelpIconWrapper = styled.div`
  position: relative;
  display: inline-flex;
  
  &:hover > div {
    display: block;
  }
`;

const HelpIcon = styled.span`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid ${theme.colors.textMuted};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: ${theme.colors.textMuted};
  cursor: help;
`;

const Tooltip = styled.div`
  display: none;
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: #2d3748;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  white-space: nowrap;
  z-index: 1000;
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: #2d3748;
  }
`;

const ChartPanel = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: ${theme.shadows.sm};
  padding: 24px 24px 20px;
  position: relative;
  min-height: 400px;
`;

const ChartLegend = styled.div`
  position: absolute;
  top: 20px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #4a90c2;
  color: white;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
`;

const ChartContainer = styled.div`
  height: 320px;
  position: relative;
  margin-top: 50px;
`;

const ChartYAxis = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 40px;
  width: 80px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-right: 15px;
`;

const ChartYLabel = styled.div`
  font-size: 12px;
  color: #a0aec0;
  text-align: right;
  font-weight: 400;
`;

const ChartArea = styled.div`
  position: absolute;
  left: 80px;
  right: 20px;
  top: 0;
  bottom: 0;
`;

const ChartSvg = styled.svg`
  width: 100%;
  height: calc(100% - 40px);
  overflow: visible;
`;

const ChartXAxis = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  display: flex;
  justify-content: space-between;
  padding-top: 15px;
`;

const ChartXLabel = styled.div`
  font-size: 12px;
  color: #a0aec0;
  text-align: center;
  flex: 1;
  padding: 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const BottomGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
`;

const Panel = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: ${theme.shadows.sm};
  overflow: hidden;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid ${theme.colors.border};
`;

const PanelTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
`;

const PanelAction = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 13px;
  color: ${theme.colors.textSecondary};
  cursor: pointer;
  
  &:hover {
    background: ${theme.colors.gray50};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  padding: 10px 20px;
  text-align: left;
  font-size: 13px;
  font-weight: 500;
  color: ${theme.colors.textSecondary};
  background: ${theme.colors.gray50};
  border-bottom: 1px solid ${theme.colors.border};
  
  &:nth-child(2), &:nth-child(3), &:nth-child(4) {
    text-align: right;
  }
`;

const Td = styled.td`
  padding: 10px 20px;
  font-size: 14px;
  color: ${theme.colors.textPrimary};
  border-bottom: 1px solid ${theme.colors.border};
  
  &:nth-child(2), &:nth-child(3), &:nth-child(4) {
    text-align: right;
  }
`;

const WarningPanel = styled.div`
  padding: 16px 20px;
  background: #fff3cd;
  border-radius: 4px;
  margin: 16px;
`;

const WarningTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #856404;
  margin-bottom: 8px;
`;

const WarningItem = styled.div`
  font-size: 13px;
  color: #856404;
  margin-bottom: 4px;
  
  a {
    color: #e74c3c;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const WarningLink = styled.span`
  color: ${theme.colors.primary};
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const StockInfo = styled.div`
  padding: 16px 20px;
`;

const StockTitle = styled.div`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
  margin-bottom: 4px;
`;

const StockValue = styled.div`
  font-size: 22px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
`;

const StockRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 16px;
`;

// ============================================
// Types and Constants
// ============================================

type TimePeriod = 'today' | 'week' | 'month' | 'quarter' | 'year';
type MetricType = 'revenue' | 'cost' | 'profit' | 'avgCheck';

const timePeriodLabels: Record<TimePeriod, string> = {
  today: 'сьогодні',
  week: 'тиждень',
  month: 'місяць',
  quarter: 'квартал',
  year: 'рік',
};

const metricLabels: Record<MetricType, string> = {
  revenue: 'Виручка',
  cost: 'Собівартість продажів',
  profit: 'Прибуток',
  avgCheck: 'Середній чек',
};

// ============================================
// Component
// ============================================

export default function Dashboard() {
  const { companyId } = useAppSelector(state => state.auth);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [activeMetric, setActiveMetric] = useState<MetricType>('revenue');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [stockStats, setStockStats] = useState({
    totalQuantity: 0,
    retailValue: 0,
    costValue: 0,
    zeroCostCount: 0,
    negativeStockCount: 0,
    expiredCount: 0,
    productsCount: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (companyId) {
      loadData();
    }
  }, [companyId, timePeriod, selectedStore]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClick = () => {
      setShowTimeDropdown(false);
      setShowStoreDropdown(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const getDateRange = () => {
    const now = new Date();
    let from: Date;
    let to: Date = now;
    
    switch (timePeriod) {
      case 'today':
        // From 00:00 today to now
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        break;
      case 'week':
        // From Monday 00:00 of current week to now
        const dayOfWeek = now.getDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMonday, 0, 0, 0);
        break;
      case 'month':
        // From 1st of current month to now
        from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        break;
      case 'quarter':
        // From 1st of current quarter to now
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        from = new Date(now.getFullYear(), quarterMonth, 1, 0, 0, 0);
        break;
      case 'year':
        // From January 1st of current year to now
        from = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        break;
      default:
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0);
    }
    
    return { 
      from: Math.floor(from.getTime() / 1000), 
      to: Math.floor(to.getTime() / 1000) 
    };
  };

  const loadData = async () => {
    if (!companyId) {
      console.log('No companyId, skipping data load');
      return;
    }
    
    try {
      setLoading(true);
      const { from, to } = getDateRange();
      
      console.log('Loading dashboard data:', { companyId, from, to, selectedStore });
      
      const filters: { from: number; to: number; stores?: string[] } = { from, to };
      if (selectedStore !== 'all') {
        filters.stores = [selectedStore];
      }
      
      const [docsResponse, storesResponse, stockStatsResponse] = await Promise.all([
        documentApi.searchDocuments(companyId, filters, 0, 10000),
        dataApi.getStores(companyId),
        dataApi.getStockStats(companyId),
      ]);
      
      console.log('API Responses:', {
        docs: { status: docsResponse.status, count: docsResponse.data?.length },
        stores: { status: storesResponse.status, count: storesResponse.data?.length },
        stats: { status: stockStatsResponse.status, data: stockStatsResponse.data },
      });
      
      if (docsResponse.status && docsResponse.data) {
        setDocuments(docsResponse.data);
      }
      
      if (storesResponse.status && storesResponse.data) {
        setStores(storesResponse.data);
      }
      
      if (stockStatsResponse.status && stockStatsResponse.data) {
        setStockStats(stockStatsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from documents (including returns)
  const stats = useMemo(() => {
    const sales = documents.filter(d => d.type === 'sales' || d.type === 'sale');
    const returns = documents.filter(d => d.type === 'return_sales');
    
    // Revenue = sales - returns
    const salesRevenue = sales.reduce((sum, d) => sum + (d.total || 0), 0);
    const returnsAmount = returns.reduce((sum, d) => sum + (d.total || 0), 0);
    const revenue = salesRevenue - returnsAmount;
    
    // Cost = sales cost - returns cost
    const salesCost = sales.reduce((sum, d) => sum + ((d as any).cost_total || 0), 0);
    const returnsCost = returns.reduce((sum, d) => sum + ((d as any).cost_total || 0), 0);
    const cost = salesCost - returnsCost;
    
    // Average check = net revenue / number of sales transactions
    // (Returns reduce revenue but don't affect the count of sales transactions)
    const avgCheck = sales.length > 0 ? revenue / sales.length : 0;
    
    return {
      revenue,
      cost,
      profit: revenue - cost,
      avgCheck,
      salesCount: sales.length,
    };
  }, [documents]);

  // Generate chart data based on period
  const chartData = useMemo(() => {
    const { from, to } = getDateRange();
    const fromDate = new Date(from * 1000);
    const toDate = new Date(to * 1000);
    
    let labels: string[] = [];
    let buckets: number[] = [];
    let bucketDates: Date[] = [];
    
    const dayNamesFull = ['понеділок', 'вівторок', 'середа', 'четвер', 'п\'ятниця', 'субота', 'неділя'];
    const monthNamesShort = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
    
    if (timePeriod === 'today') {
      // Hourly buckets for today
      for (let h = 0; h <= toDate.getHours(); h++) {
        labels.push(`${h}:00`);
        bucketDates.push(new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate(), h));
      }
      buckets = new Array(labels.length).fill(0);
    } else if (timePeriod === 'week') {
      // Daily buckets for current week (Mon-Sun) with full day names
      for (let d = 0; d < 7; d++) {
        const date = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate() + d);
        if (date <= toDate) {
          labels.push(dayNamesFull[d]);
          bucketDates.push(date);
        }
      }
      buckets = new Array(labels.length).fill(0);
    } else if (timePeriod === 'month') {
      // Daily buckets for current month
      const daysInMonth = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(fromDate.getFullYear(), fromDate.getMonth(), d);
        if (date <= toDate) {
          labels.push(`${d}`);
          bucketDates.push(date);
        }
      }
      buckets = new Array(labels.length).fill(0);
    } else if (timePeriod === 'quarter') {
      // Weekly buckets for current quarter
      const quarterStart = new Date(fromDate);
      let weekStart = new Date(quarterStart);
      while (weekStart <= toDate) {
        labels.push(`${weekStart.getDate()} ${monthNamesShort[weekStart.getMonth()]}`);
        bucketDates.push(new Date(weekStart));
        weekStart = new Date(weekStart.getTime() + 7 * 86400000);
      }
      buckets = new Array(labels.length).fill(0);
    } else {
      // Monthly buckets for current year
      for (let m = 0; m <= toDate.getMonth(); m++) {
        labels.push(monthNamesShort[m]);
        bucketDates.push(new Date(fromDate.getFullYear(), m, 1));
      }
      buckets = new Array(labels.length).fill(0);
    }
    
    // Fill buckets with document data (including returns)
    const sales = documents.filter(d => d.type === 'sales' || d.type === 'sale');
    const returns = documents.filter(d => d.type === 'return_sales');
    const counts = new Array(buckets.length).fill(0);
    
    const getLocalDate = (timestamp: number) => {
      const d = new Date(timestamp * 1000);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };
    
    // Helper to find bucket index for a document
    const findBucketIndex = (doc: Document): number => {
      const docTimestamp = doc.date || 0;
      const docDate = new Date(docTimestamp * 1000);
      const docLocalDate = getLocalDate(docTimestamp);
      
      if (timePeriod === 'today') {
        return docDate.getHours();
      } else if (timePeriod === 'week') {
        for (let i = 0; i < bucketDates.length; i++) {
          const bucketDate = bucketDates[i];
          if (docLocalDate.getFullYear() === bucketDate.getFullYear() &&
              docLocalDate.getMonth() === bucketDate.getMonth() &&
              docLocalDate.getDate() === bucketDate.getDate()) {
            return i;
          }
        }
      } else if (timePeriod === 'month') {
        return docDate.getDate() - 1;
      } else if (timePeriod === 'quarter') {
        for (let i = 0; i < bucketDates.length; i++) {
          const weekStart = bucketDates[i];
          const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
          if (docLocalDate >= weekStart && docLocalDate < weekEnd) {
            return i;
          }
        }
      } else {
        return docDate.getMonth();
      }
      return -1;
    };
    
    // Helper to get value for a metric
    const getValue = (doc: Document, isReturn: boolean): number => {
      const multiplier = isReturn ? -1 : 1;
      switch (activeMetric) {
        case 'revenue':
          return (doc.total || 0) * multiplier;
        case 'cost':
          return ((doc as any).cost_total || 0) * multiplier;
        case 'profit':
          return ((doc.total || 0) - ((doc as any).cost_total || 0)) * multiplier;
        case 'avgCheck':
          return doc.total || 0; // Returns don't count for avg check
        default:
          return 0;
      }
    };
    
    // Process sales
    sales.forEach(doc => {
      const bucketIndex = findBucketIndex(doc);
      if (bucketIndex >= 0 && bucketIndex < buckets.length) {
        buckets[bucketIndex] += getValue(doc, false);
        counts[bucketIndex]++;
      }
    });
    
    // Process returns (subtract from buckets, except for avgCheck)
    if (activeMetric !== 'avgCheck') {
      returns.forEach(doc => {
        const bucketIndex = findBucketIndex(doc);
        if (bucketIndex >= 0 && bucketIndex < buckets.length) {
          buckets[bucketIndex] += getValue(doc, true);
        }
      });
    }
    
    // For avgCheck, calculate average per bucket (based on sales only)
    if (activeMetric === 'avgCheck') {
      buckets = buckets.map((sum, i) => counts[i] > 0 ? sum / counts[i] : 0);
    }
    
    return { labels, data: buckets, counts };
  }, [documents, timePeriod, activeMetric]);

  // Group documents by type
  const docsByType = useMemo(() => {
    const types: Record<string, { count: number; total: number; items: number }> = {
      'Продаж': { count: 0, total: 0, items: 0 },
      'Закупівля': { count: 0, total: 0, items: 0 },
      'Повернення продажу': { count: 0, total: 0, items: 0 },
      'Повернення закупівлі': { count: 0, total: 0, items: 0 },
      'Коригування': { count: 0, total: 0, items: 0 },
      'Інвентаризація': { count: 0, total: 0, items: 0 },
      'Оприбуткування': { count: 0, total: 0, items: 0 },
      'Списання': { count: 0, total: 0, items: 0 },
      'Переміщення': { count: 0, total: 0, items: 0 },
    };
    
    const typeMap: Record<string, string> = {
      'sales': 'Продаж',
      'sale': 'Продаж',
      'purchases': 'Закупівля',
      'purchase': 'Закупівля',
      'return_sales': 'Повернення продажу',
      'return_purchases': 'Повернення закупівлі',
      'changes': 'Коригування',
      'inventory': 'Інвентаризація',
      'receipt': 'Оприбуткування',
      'write_off': 'Списання',
      'movements': 'Переміщення',
      'movement': 'Переміщення',
    };
    
    documents.forEach(doc => {
      const typeName = typeMap[doc.type] || doc.type;
      if (types[typeName]) {
        types[typeName].count++;
        types[typeName].total += doc.total || 0;
        types[typeName].items += (doc.items?.length || 0);
      }
    });
    
    return types;
  }, [documents]);

  const formatPrice = (price: number, decimals = 2) => {
    // Format with space as thousands separator (like Ainur)
    const parts = price.toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join(',');
  };

  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Generate chart points data
  const chartPoints = useMemo(() => {
    const max = Math.max(...chartData.data, 1);
    return chartData.data.map((value, i) => {
      const x = chartData.data.length > 1 
        ? (i / (chartData.data.length - 1)) * 100 
        : 50;
      const y = 100 - (value / max) * 100;
      return { x, y, value, label: chartData.labels[i] };
    });
  }, [chartData]);

  // Y-axis labels
  const maxValue = Math.max(...chartData.data, 1);
  const yLabels = [
    formatPrice(maxValue),
    formatPrice(maxValue * 0.75),
    formatPrice(maxValue * 0.5),
    formatPrice(maxValue * 0.25),
    '0',
  ];

  const selectedStoreName = selectedStore === 'all' 
    ? 'всіх магазинах' 
    : stores.find(s => s._id === selectedStore)?.name || 'магазині';

  return (
    <MainLayout>
      <DashboardContainer>
        <TitleRow>
          <TitleText>Показники за</TitleText>
          <TitleDropdown onClick={(e) => e.stopPropagation()}>
            <TitleDropdownButton onClick={() => setShowTimeDropdown(!showTimeDropdown)}>
              {timePeriodLabels[timePeriod]}
              <ChevronDown />
            </TitleDropdownButton>
            <DropdownMenu isOpen={showTimeDropdown}>
              {Object.entries(timePeriodLabels).map(([key, label]) => (
                <DropdownItem
                  key={key}
                  active={timePeriod === key}
                  onClick={() => { setTimePeriod(key as TimePeriod); setShowTimeDropdown(false); }}
                >
                  {label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </TitleDropdown>
          <TitleText>по</TitleText>
          <TitleDropdown onClick={(e) => e.stopPropagation()}>
            <TitleDropdownButton onClick={() => setShowStoreDropdown(!showStoreDropdown)}>
              {selectedStoreName}
              <ChevronDown />
            </TitleDropdownButton>
            <DropdownMenu isOpen={showStoreDropdown}>
              <DropdownItem 
                active={selectedStore === 'all'}
                onClick={() => { setSelectedStore('all'); setShowStoreDropdown(false); }}
              >
                всіх магазинах
              </DropdownItem>
              {stores.map(store => (
                <DropdownItem
                  key={store._id}
                  active={selectedStore === store._id}
                  onClick={() => { setSelectedStore(store._id); setShowStoreDropdown(false); }}
                >
                  {store.name}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </TitleDropdown>
        </TitleRow>

        <MainGrid>
          <MetricsPanel>
            <MetricCard 
              active={activeMetric === 'revenue'} 
              onClick={() => setActiveMetric('revenue')}
            >
              <MetricValue>{formatPrice(stats.revenue)}</MetricValue>
              <MetricLabel>
                Виручка{' '}
                <HelpIconWrapper>
                  <HelpIcon>?</HelpIcon>
                  <Tooltip>Сума продажів</Tooltip>
                </HelpIconWrapper>
              </MetricLabel>
            </MetricCard>
            
            <MetricCard 
              active={activeMetric === 'cost'} 
              onClick={() => setActiveMetric('cost')}
            >
              <MetricValue>{formatPrice(stats.cost)}</MetricValue>
              <MetricLabel>
                Собівартість продажів{' '}
                <HelpIconWrapper>
                  <HelpIcon>?</HelpIcon>
                  <Tooltip>Собівартість всіх проданих товарів</Tooltip>
                </HelpIconWrapper>
              </MetricLabel>
            </MetricCard>
            
            <MetricCard 
              active={activeMetric === 'profit'} 
              onClick={() => setActiveMetric('profit')}
            >
              <MetricValue>{formatPrice(stats.profit)}</MetricValue>
              <MetricLabel>
                Прибуток{' '}
                <HelpIconWrapper>
                  <HelpIcon>?</HelpIcon>
                  <Tooltip>Різниця між виручкою і собівартістю продажів</Tooltip>
                </HelpIconWrapper>
              </MetricLabel>
            </MetricCard>
            
            <MetricCard 
              active={activeMetric === 'avgCheck'} 
              onClick={() => setActiveMetric('avgCheck')}
            >
              <MetricValue>{formatPrice(stats.avgCheck)}</MetricValue>
              <MetricLabel>
                Середній чек{' '}
                <HelpIconWrapper>
                  <HelpIcon>?</HelpIcon>
                  <Tooltip>Виручка розділена на кількість продажів</Tooltip>
                </HelpIconWrapper>
              </MetricLabel>
            </MetricCard>
          </MetricsPanel>

          <ChartPanel>
            <ChartLegend>{metricLabels[activeMetric]}</ChartLegend>
            <ChartContainer>
              <ChartYAxis>
                {yLabels.map((label, i) => (
                  <ChartYLabel key={i}>{label}</ChartYLabel>
                ))}
              </ChartYAxis>
              <ChartArea>
                <ChartSvg 
                  viewBox="0 0 1000 280" 
                  preserveAspectRatio="none"
                  onMouseMove={(e) => {
                    const svg = e.currentTarget;
                    const rect = svg.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 1000;
                    // Find closest point
                    let closest = 0;
                    let minDist = Infinity;
                    chartPoints.forEach((p, i) => {
                      const px = (p.x / 100) * 1000;
                      const dist = Math.abs(x - px);
                      if (dist < minDist) {
                        minDist = dist;
                        closest = i;
                      }
                    });
                    setHoveredPoint(closest);
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5ba3d9" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#5ba3d9" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={ratio * 280}
                      x2="1000"
                      y2={ratio * 280}
                      stroke="#e8edf2"
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* Area fill */}
                  <path
                    d={(() => {
                      if (chartPoints.length < 2) return '';
                      const pts = chartPoints.map(p => ({
                        x: (p.x / 100) * 1000,
                        y: (p.y / 100) * 280
                      }));
                      let path = `M ${pts[0].x} ${pts[0].y}`;
                      for (let i = 0; i < pts.length - 1; i++) {
                        const p0 = pts[Math.max(0, i - 1)];
                        const p1 = pts[i];
                        const p2 = pts[i + 1];
                        const p3 = pts[Math.min(pts.length - 1, i + 2)];
                        const tension = 0.35;
                        const cp1x = p1.x + (p2.x - p0.x) * tension;
                        const cp1y = p1.y + (p2.y - p0.y) * tension;
                        const cp2x = p2.x - (p3.x - p1.x) * tension;
                        const cp2y = p2.y - (p3.y - p1.y) * tension;
                        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
                      }
                      path += ` L ${pts[pts.length - 1].x} 280 L ${pts[0].x} 280 Z`;
                      return path;
                    })()}
                    fill="url(#areaGradient)"
                  />
                  
                  {/* Main line */}
                  <path
                    d={(() => {
                      if (chartPoints.length < 2) return '';
                      const pts = chartPoints.map(p => ({
                        x: (p.x / 100) * 1000,
                        y: (p.y / 100) * 280
                      }));
                      let path = `M ${pts[0].x} ${pts[0].y}`;
                      for (let i = 0; i < pts.length - 1; i++) {
                        const p0 = pts[Math.max(0, i - 1)];
                        const p1 = pts[i];
                        const p2 = pts[i + 1];
                        const p3 = pts[Math.min(pts.length - 1, i + 2)];
                        const tension = 0.35;
                        const cp1x = p1.x + (p2.x - p0.x) * tension;
                        const cp1y = p1.y + (p2.y - p0.y) * tension;
                        const cp2x = p2.x - (p3.x - p1.x) * tension;
                        const cp2y = p2.y - (p3.y - p1.y) * tension;
                        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
                      }
                      return path;
                    })()}
                    fill="none"
                    stroke="#4a9fd4"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Hover lines and point */}
                  {hoveredPoint !== null && chartPoints[hoveredPoint] && (
                    <g className="hover-elements">
                      {/* Vertical hover line */}
                      <line
                        x1={(chartPoints[hoveredPoint].x / 100) * 1000}
                        y1="0"
                        x2={(chartPoints[hoveredPoint].x / 100) * 1000}
                        y2="280"
                        stroke="#a0aec0"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                      />
                      {/* Horizontal hover line */}
                      <line
                        x1="0"
                        y1={(chartPoints[hoveredPoint].y / 100) * 280}
                        x2={(chartPoints[hoveredPoint].x / 100) * 1000}
                        y2={(chartPoints[hoveredPoint].y / 100) * 280}
                        stroke="#a0aec0"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                      />
                      {/* Data point circle */}
                      <circle
                        cx={(chartPoints[hoveredPoint].x / 100) * 1000}
                        cy={(chartPoints[hoveredPoint].y / 100) * 280}
                        r="7"
                        fill="white"
                        stroke="#4a9fd4"
                        strokeWidth="3"
                      />
                      {/* Tooltip background */}
                      <rect
                        x={(chartPoints[hoveredPoint].x / 100) * 1000 - 55}
                        y={(chartPoints[hoveredPoint].y / 100) * 280 - 40}
                        width="110"
                        height="28"
                        rx="4"
                        fill="#4a5568"
                      />
                      {/* Tooltip text */}
                      <text
                        x={(chartPoints[hoveredPoint].x / 100) * 1000}
                        y={(chartPoints[hoveredPoint].y / 100) * 280 - 21}
                        textAnchor="middle"
                        fill="white"
                        fontSize="14"
                        fontWeight="500"
                      >
                        {formatPrice(chartPoints[hoveredPoint].value)}
                      </text>
                    </g>
                  )}
                  
                  {/* Invisible overlay for mouse events */}
                  <rect
                    x="0"
                    y="0"
                    width="1000"
                    height="280"
                    fill="transparent"
                    style={{ cursor: 'crosshair' }}
                  />
                </ChartSvg>
                <ChartXAxis>
                  {chartData.labels.map((label, i) => (
                    <ChartXLabel key={i}>{label}</ChartXLabel>
                  ))}
                </ChartXAxis>
              </ChartArea>
            </ChartContainer>
          </ChartPanel>
        </MainGrid>

        <BottomGrid>
          <Panel>
            <PanelHeader>
              <PanelTitle>Документи</PanelTitle>
              <PanelAction>
                <Calendar size={14} />
                {timePeriodLabels[timePeriod]}
              </PanelAction>
            </PanelHeader>
            <Table>
              <thead>
                <tr>
                  <Th>Найменування</Th>
                  <Th>К-сть</Th>
                  <Th>Сума</Th>
                  <Th>Склад</Th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(docsByType).map(([type, data]) => (
                  <tr key={type}>
                    <Td>{type}</Td>
                    <Td>{data.count}</Td>
                    <Td>{formatPrice(data.total)}</Td>
                    <Td>{data.items}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>Оцінка складу по всіх магазинах</PanelTitle>
            </PanelHeader>
            <WarningPanel>
              <WarningTitle>Увага</WarningTitle>
              {stockStats.zeroCostCount > 0 && (
                <WarningItem>
                  • <WarningLink onClick={() => navigate('/pos/products?filter=zero_cost')}>
                    {stockStats.zeroCostCount} поз. з собівартістю рівною 0 грн
                  </WarningLink> (<a href="#">як змінити собівартість</a>)
                </WarningItem>
              )}
              {stockStats.negativeStockCount > 0 && (
                <WarningItem>
                  • <WarningLink onClick={() => navigate('/pos/products?filter=negative_stock')}>
                    {stockStats.negativeStockCount} поз. з залишком менше 0
                  </WarningLink>
                </WarningItem>
              )}
              {stockStats.expiredCount > 0 && (
                <WarningItem>
                  • <WarningLink onClick={() => navigate('/pos/products?filter=expired')}>
                    {stockStats.expiredCount} поз. з істёкшим сроком годності
                  </WarningLink>
                </WarningItem>
              )}
            </WarningPanel>
            <StockInfo>
              <StockTitle>Кількість товару</StockTitle>
              <StockValue>{formatPrice(stockStats.totalQuantity, 0)} од.</StockValue>
              
              <StockRow>
                <div>
                  <StockTitle>Вартість товару</StockTitle>
                  <StockTitle>В роздрібних цінах</StockTitle>
                  <StockValue style={{ fontSize: '18px' }}>{formatPrice(stockStats.retailValue)} грн</StockValue>
                </div>
                <div>
                  <StockTitle>Вартість товару</StockTitle>
                  <StockTitle>По собівартості</StockTitle>
                  <StockValue style={{ fontSize: '18px' }}>{formatPrice(stockStats.costValue)} грн</StockValue>
                </div>
              </StockRow>
            </StockInfo>
          </Panel>
        </BottomGrid>
      </DashboardContainer>
    </MainLayout>
  );
}
